import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const artifactDir = process.env.UI_ARTIFACT_DIR || path.join(os.tmpdir(), `world-quiz-ui-${process.pid}`);
const widths = (process.env.UI_TEST_WIDTHS || '320,390,1119,1120,1280,1440').split(',').map(Number);
const languages = (process.env.UI_TEST_LANGUAGES || 'en,cs,de').split(',');
const executablePath = process.env.PRERENDER_CHROME_PATH || '/usr/bin/google-chrome';
const snapshots = new Map();
const fixtureUid = 'local-auth-ui-fixture';
const fixtureName = 'VeryLongNicknameForLayoutTesting';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

assert(widths.every((width) => Number.isInteger(width) && width >= 320), 'Invalid test viewport width');
assert(languages.every((language) => ['en', 'cs', 'de'].includes(language)), 'Invalid test language');
const translations = Object.fromEntries(await Promise.all(['en', 'cs', 'de'].map(async (language) => [
  language, JSON.parse(await fs.readFile(path.join(rootDir, `src/locales/${language}/translation.json`), 'utf8')),
])));
await fs.access(path.join(distDir, 'index.html')).catch(() => {
  throw new Error('Production build missing. Run pnpm --filter frontend build first.');
});
const firebaseSource = await fs.readFile(path.join(rootDir, 'src/firebase.ts'), 'utf8');
const apiKey = firebaseSource.match(/apiKey:\s*["']([^"']+)["']/)?.[1];
assert(apiKey, 'Could not identify the public Firebase API key for the local persistence fixture');

// The fixture has no valid credential. All external traffic is intercepted below;
// the real Firebase SDK still exercises restoration and its persistence migration.
const now = Math.floor(Date.now() / 1000);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${encode({ alg: 'none' })}.${encode({
  sub: fixtureUid, user_id: fixtureUid, iat: now, auth_time: now, exp: now + 3600,
  firebase: { sign_in_provider: 'password' },
})}.local-test-only`;
const fixtureUser = {
  uid: fixtureUid,
  displayName: fixtureName,
  email: 'auth-ui@example.invalid',
  emailVerified: true,
  isAnonymous: false,
  providerData: [{ providerId: 'password', uid: 'auth-ui@example.invalid', email: 'auth-ui@example.invalid', displayName: fixtureName, photoURL: null, phoneNumber: null }],
  stsTokenManager: { refreshToken: 'local-test-only', accessToken: token, expirationTime: Date.now() + 3600000 },
  createdAt: String(Date.now()),
  lastLoginAt: String(Date.now()),
  apiKey,
  appName: '[DEFAULT]',
};
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/__auth-ui-seed') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><title>Local auth fixture</title>');
      return;
    }
    if (snapshots.has(pathname)) {
      response.setHeader('Content-Type', 'text/html');
      response.end(snapshots.get(pathname));
      return;
    }
    let filePath = path.resolve(distDir, `.${pathname}`);
    if (!filePath.startsWith(`${distDir}${path.sep}`) && filePath !== distDir) {
      response.writeHead(400).end();
      return;
    }
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat?.isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!stat || !await fs.stat(filePath).catch(() => null)) filePath = path.join(distDir, 'index.html');
    response.setHeader('Content-Type', mimeTypes[path.extname(filePath)] || 'application/octet-stream');
    response.end(await fs.readFile(filePath));
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

async function interceptNetwork(context, slow = false) {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) {
      if (slow && url.pathname.endsWith('.js')) await delay(200);
      await route.continue();
    } else if (url.hostname === 'identitytoolkit.googleapis.com' && url.pathname.endsWith('/accounts:lookup')) {
      if (slow) await delay(800);
      await route.fulfill({ json: { users: [{
        localId: fixtureUid, displayName: fixtureName, email: fixtureUser.email,
        emailVerified: true, createdAt: fixtureUser.createdAt, lastLoginAt: fixtureUser.lastLoginAt,
        providerUserInfo: fixtureUser.providerData,
      }] } });
    } else {
      await route.abort('blockedbyclient');
    }
  });
}

function inspectNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav || getComputedStyle(nav).position !== 'fixed') return null;
  const visible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth &&
      rect.bottom > 0 && rect.top < innerHeight && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  };
  const rect = (element) => {
    if (!visible(element)) return null;
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
  };
  return {
    state: document.querySelector('.navbar-menu')?.getAttribute('data-auth-state'),
    guestLinks: [...document.querySelectorAll('.navbar a[href*="/auth"], .mobile-menu a[href*="/auth"]')].filter(visible).length,
    nav: rect(nav),
    links: rect(document.querySelector('.navbar-nav-links')),
    hamburger: visible(document.querySelector('.hamburger-button')),
    user: visible(document.querySelector('.navbar-user-button')),
    linkBounds: [...document.querySelectorAll('.navbar-nav-links .nav-link')].filter(visible).map(rect),
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
}

function checkLayout(frame, width) {
  const desktop = width >= 1120;
  assert.equal(!!frame.links, desktop, `Wrong navigation for ${width}px viewport`);
  assert.equal(frame.hamburger, !desktop, `Wrong hamburger visibility at ${width}px`);
  assert(!frame.overflow, `Horizontal page overflow at ${width}px`);
  assert(frame.nav && Math.abs(frame.nav.height - 64) < 1, 'Navbar height changed');
  for (const bounds of frame.linkBounds) {
    assert(bounds.x >= -1 && bounds.right <= width + 1 && bounds.bottom <= frame.nav.bottom + 1, 'Navigation links overflow or wrap');
  }
}

async function checkStaticPaint(language, width) {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 844 } });
  try {
    await interceptNetwork(context);
    const page = await context.newPage();
    await page.goto(`${origin}/${language}`, { waitUntil: 'load' });
    const frame = await page.evaluate(inspectNavbar);
    assert(frame, 'Prerendered navbar missing');
    checkLayout(frame, width);
    assert.equal(frame.state, 'pending', 'Prerender serialized a resolved auth state');
    assert.equal(frame.guestLinks, 0, 'Guest links visible before JavaScript/auth resolution');
    assert.equal(frame.user, false, 'Prerender serialized a personal profile');
    assert.equal(await page.locator('.navbar a[href*="/auth"], .mobile-menu a[href*="/auth"]').count(), 0, 'Prerender serialized guest controls');
  } finally {
    await context.close();
  }
}

async function checkSettings(page, cdp) {
  await page.locator('.navbar-user-button').click();
  await page.locator('.settings-page-card').waitFor();
  // Let the card's entry animation finish before measuring scroll repaints.
  await page.waitForTimeout(500);
  let layers = [];
  const onLayers = (event) => { layers = event.layers || []; };
  cdp.on('LayerTree.layerTreeDidChange', onLayers);
  await cdp.send('LayerTree.enable');
  try {
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.container-fluid.p-0' });
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    // Mobile emulation uses different compositing heuristics; test switching it off too.
    for (const mobile of [true, false]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: mobile ? 390 : 1440, height: 900, deviceScaleFactor: mobile ? 2 : 1, mobile,
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const rootPaintsBefore = layers.find(layer => layer.backendNodeId === root.backendNodeId && layer.drawsContent)?.paintCount ?? 0;
      const scrolled = await page.evaluate(() => new Promise(resolve => {
        const scroller = document.querySelector('.container-fluid.p-0');
        const distance = scroller.scrollHeight - scroller.clientHeight;
        let frame = 0;
        function step() {
          scroller.scrollTop = distance * (++frame / 30);
          if (frame < 30) requestAnimationFrame(step);
          else requestAnimationFrame(() => requestAnimationFrame(() => resolve(scroller.scrollTop)));
        }
        requestAnimationFrame(step);
      }));
      assert(scrolled > 100, 'Settings scroll regression did not exercise overflowing content');
      assert(layers.some(layer => layer.backendNodeId === node.backendNodeId && layer.drawsContent),
        `Settings lost its composited scroll surface in ${mobile ? 'mobile' : 'desktop'} mode`);
      const rootPaintsAfter = layers.find(layer => layer.backendNodeId === root.backendNodeId && layer.drawsContent)?.paintCount ?? 0;
      assert(rootPaintsAfter - rootPaintsBefore < 10, 'Scrolling settings repainted the root on most frames');
    }
    console.log('[settings] PASS composited scrolling before and after disabling mobile emulation');
  } finally {
    cdp.off('LayerTree.layerTreeDidChange', onLayers);
    await cdp.send('LayerTree.disable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...page.viewportSize(), deviceScaleFactor: 1, mobile: false });
  }

  // Firestore is blocked by interceptNetwork: switching must not wait for a write acknowledgement.
  const previousUrl = new URL(page.url());
  const nextLanguage = previousUrl.pathname.startsWith('/cs/') ? 'de' : 'cs';
  await page.locator('.settings-language-switcher').getByRole('button', { name: nextLanguage === 'cs' ? 'CZ' : 'DE', exact: true }).click();
  await page.waitForURL(url => url.pathname === `/${nextLanguage}/settings`, { timeout: 5000 });
  await page.waitForFunction(language => document.documentElement.lang === language, nextLanguage);
  assert.equal(await page.locator('.settings-header h2').textContent(), translations[nextLanguage].settings.title);
  assert.equal(new URL(page.url()).search, previousUrl.search);
  assert.equal(new URL(page.url()).hash, previousUrl.hash);
  console.log('[settings] PASS language and URL switch without waiting for Firestore');
}

async function checkRestoration(language, width, authenticated) {
  const label = `${language}/${width}/${authenticated ? 'signed-in' : 'guest'}`;
  const context = await browser.newContext({ viewport: { width, height: 844 }, locale: language });
  let page;
  try {
    await interceptNetwork(context, true);
    page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    if (authenticated) {
      await page.goto(`${origin}/__auth-ui-seed`);
      await page.evaluate(({ key, user }) => {
        localStorage.setItem(`firebase:authUser:${key}:[DEFAULT]`, JSON.stringify(user));
        localStorage.setItem(`profileFlag_${user.uid}`, 'cz');
      }, { key: apiKey, user: fixtureUser });
    }
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await context.addInitScript(`(() => {
      const inspect = ${inspectNavbar.toString()};
      window.__authUiFrames = [];
      let last = '';
      function sample() {
        const frame = inspect();
        const serialized = JSON.stringify(frame);
        if (frame && serialized !== last) window.__authUiFrames.push(frame);
        last = serialized;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    })()`);
    for (const navigation of ['initial', 'uncached reload']) {
      if (navigation === 'initial') await page.goto(`${origin}/${language}`, { waitUntil: 'domcontentloaded' });
      else await page.reload({ waitUntil: 'domcontentloaded' });
      const expectedState = authenticated ? 'authenticated' : 'guest';
      await page.waitForFunction((state) => document.querySelector('.navbar-menu')?.getAttribute('data-auth-state') === state, expectedState);
      // Include a completed paint after auth resolution, rather than only a DOM mutation.
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const frames = await page.evaluate(() => window.__authUiFrames);
      assert(frames.some((frame) => frame.state === 'pending'), `${label}: no pending paint observed`);
      assert(frames.some((frame) => frame.state === expectedState), `${label}: final paint missing`);
      frames.forEach((frame) => {
        checkLayout(frame, width);
        if (authenticated || frame.state === 'pending') assert.equal(frame.guestLinks, 0, `${label}: guest UI flashed during ${navigation}`);
      });
      const desktopFrames = frames.filter((frame) => frame.links);
      if (desktopFrames.length) {
        const first = desktopFrames[0].links;
        assert(desktopFrames.every((frame) => Math.abs(frame.links.x - first.x) < 1 && Math.abs(frame.links.width - first.width) < 1), `${label}: navigation moved during ${navigation}`);
      }
      if (width < 1120) {
        await page.locator('.hamburger-button').click();
        assert.equal(await page.locator('.hamburger-button').getAttribute('aria-expanded'), 'true');
        await page.locator('.mobile-menu.open').waitFor({ state: 'visible' });
        const section = page.locator('.mobile-auth-section');
        assert.equal(await section.getAttribute('data-auth-state'), expectedState);
        assert.equal(await section.locator('a[href*="/auth"]').count(), authenticated ? 0 : 2);
        if (authenticated) await section.locator('.mobile-user-button').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.hamburger-button').getAttribute('aria-expanded'), 'false');
        assert(await page.locator('.hamburger-button').evaluate((element) => element === document.activeElement), 'Escape did not return focus to the menu toggle');
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(() => ({
          inDrawer: !!document.activeElement?.closest('.mobile-menu'),
          active: document.activeElement?.outerHTML,
          drawerVisibility: getComputedStyle(document.querySelector('.mobile-menu')).visibility,
        }));
        assert(!focus.inDrawer, `Closed mobile links remain in the keyboard tab order: ${JSON.stringify(focus)}`);
      } else {
        assert.equal(await page.locator('.navbar-menu a[href*="/auth"]').count(), authenticated ? 0 : 2);
      }
    }
    if (authenticated) {
      if (language === languages[0] && width === Math.max(...widths) && width >= 1120) {
        await checkSettings(page, cdp);
        await page.goto(`${origin}/${language}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelector('.navbar-menu')?.getAttribute('data-auth-state') === 'authenticated');
      }
      const beforeLogout = await page.evaluate(inspectNavbar);
      if (width < 1120) {
        await page.locator('.hamburger-button').click();
        await page.locator('.mobile-logout-button').click();
      } else {
        await page.locator('.navbar-menu > button.navbar-button').click();
      }
      await page.waitForFunction(() => document.querySelector('.navbar-menu')?.getAttribute('data-auth-state') === 'guest');
      const afterLogout = await page.evaluate(inspectNavbar);
      checkLayout(afterLogout, width);
      if (beforeLogout.links) assert(Math.abs(beforeLogout.links.x - afterLogout.links.x) < 1, 'Logout moved the navigation');
      if (width < 1120) assert.equal(await page.locator('.hamburger-button').getAttribute('aria-expanded'), 'false', 'Logout left the mobile menu open');
    }
    assert.deepEqual(pageErrors, [], `${label}: JavaScript errors`);
    console.log(`[auth-ui] PASS ${label} (initial + uncached reload)`);
  } catch (error) {
    await fs.mkdir(artifactDir, { recursive: true });
    if (page) await page.screenshot({ path: path.join(artifactDir, `${language}-${width}-${authenticated ? 'signed-in' : 'guest'}.png`) }).catch(() => {});
    throw new Error(`${label}: ${error.message}`, { cause: error });
  } finally {
    await context.close();
  }
}

async function checkLeaderboard(language, width) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, locale: language });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    await interceptNetwork(context, true);
    const url = `${origin}/${language}/leaderboards?game=cards-match&period=all-time&source=ui-test#ranking`;
    const modes = page.locator('.mode-btn');
    const periods = page.locator('.toggle-btn');
    const selection = async (gameIndex, periodIndex, displayLanguage = language) => {
      await page.locator('.game-mode-selector').waitFor({ state: 'visible' });
      await page.waitForFunction(({ gameIndex, periodIndex }) => {
        const modes = [...document.querySelectorAll('.mode-btn')];
        const periods = [...document.querySelectorAll('.toggle-btn')];
        return modes[gameIndex]?.getAttribute('aria-pressed') === 'true' &&
          (periodIndex === null ? periods.length === 0 : periods[periodIndex]?.getAttribute('aria-pressed') === 'true');
      }, { gameIndex, periodIndex });
      assert.equal(await page.locator('.mode-btn.active').count(), 1);
      assert.equal(await modes.nth(gameIndex).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.toggle-btn.active').count(), periodIndex === null ? 0 : 1);
      const titleKey = ['flagMatch', 'cardsMatch', 'guessCountry'][gameIndex];
      assert.equal((await page.locator('.leaderboard-title').textContent()).trim(), translations[displayLanguage].leaderboard.titles[titleKey]);
    };
    const preserved = () => {
      const current = new URL(page.url());
      assert.equal(current.searchParams.get('source'), 'ui-test', 'Filter selection discarded another query parameter');
      assert.equal(current.hash, '#ranking', 'Filter selection discarded the URL hash');
      return current;
    };
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await selection(1, 1);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://world-quiz.com/${language}/leaderboards`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await selection(1, 1);
    assert.equal(preserved().searchParams.get('period'), 'all-time');
    await periods.nth(0).click();
    await selection(1, 0);
    assert.equal(preserved().searchParams.has('period'), false);
    await modes.nth(0).click();
    await selection(0, 0);
    assert.equal(preserved().searchParams.has('game'), false);
    await page.goBack();
    await selection(1, 0);
    await page.goBack();
    await selection(1, 1);
    await page.goForward();
    await selection(1, 0);
    await modes.nth(2).click();
    await selection(2, null);
    assert.equal(preserved().searchParams.has('period'), false);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await selection(2, null);
    await modes.nth(1).click();
    await selection(1, 0);
    await periods.nth(1).click();
    await modes.nth(2).click();
    await selection(2, null);
    assert.equal(preserved().searchParams.get('period'), 'all-time');
    await modes.nth(1).click();
    await selection(1, 1);
    await page.goto(`${origin}/${language}/leaderboards?period=all-time&source=ui-test#ranking`);
    await selection(0, 1);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await selection(0, 1);
    await page.goto(`${origin}/${language}/leaderboards?game=invalid&period=invalid&source=ui-test#ranking`);
    await selection(0, 0);
    preserved();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await selection(1, 1);
    await page.waitForFunction(() => document.querySelector('.navbar-menu')?.getAttribute('data-auth-state') === 'guest');
    if (width < 1120) await page.locator('.hamburger-button').click();
    const nextLanguage = language === 'cs' ? 'de' : 'cs';
    const switcher = page.locator(width < 1120 ? '.mobile-menu .navbar-language-switcher' : '.navbar-menu .navbar-language-switcher');
    await switcher.getByRole('button', { name: nextLanguage === 'cs' ? 'CZ' : 'DE', exact: true }).click();
    await page.waitForURL((url) => url.pathname === `/${nextLanguage}/leaderboards`);
    await selection(1, 1, nextLanguage);
    assert.equal(preserved().searchParams.get('game'), 'cards-match');
    assert.equal(preserved().searchParams.get('period'), 'all-time');
    assert.deepEqual(pageErrors, [], 'Leaderboard navigation caused JavaScript errors');
    console.log(`[leaderboards] PASS ${language}/${width} (reload, history, filters, invalid URL, language)`);
  } catch (error) {
    await fs.mkdir(artifactDir, { recursive: true });
    await page.screenshot({ path: path.join(artifactDir, `leaderboards-${language}-${width}.png`) }).catch(() => {});
    throw new Error(`leaderboards/${language}/${width}: ${error.message}`, { cause: error });
  } finally {
    await context.close();
  }
}

async function checkFlagMatchSpam(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en' });
  const page = await context.newPage();
  try {
    await interceptNetwork(context);
    const countries = JSON.parse(await fs.readFile(path.join(distDir, 'countries-full.json'), 'utf8'));
    let fixtureCodes = ['FR', 'DE', 'ES'];
    await context.route('**/countries-full.json*', route => route.fulfill({
      json: countries.filter(country => fixtureCodes.includes(country.cca2)),
    }));
    await page.goto(`${origin}/en/game/flags/world`);
    await page.locator('[data-country="France"]').waitFor();
    await page.getByRole('button', { name: translations.en.gameHUD.showName, exact: true }).click();
    const flag = page.getByAltText(translations.en.gameHUD.flagToMatchAlt);
    const target = (await page.locator('.name-panel').textContent()).trim();
    const before = await flag.getAttribute('src');
    const wrong = target === 'France' ? 'Germany' : 'France';
    // Dispatch in one task, before React can commit: real rapid clicks must be safe too.
    const hint = await page.evaluate(({ target, wrong }) => {
      const click = name => document.querySelector(`[data-country="${name}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 180, clientY: 260 }));
      click(target);
      for (let i = 0; i < 30; i++) click(wrong);
      const indicator = document.querySelector('.flag-click-cooldown');
      return { animations: indicator.getAnimations().length, left: indicator.style.left, top: indicator.style.top };
    }, { target, wrong });
    await page.waitForFunction(({ alt, before }) => document.querySelector(`img[alt="${alt}"]`)?.getAttribute('src') !== before,
      { alt: translations.en.gameHUD.flagToMatchAlt, before }, { timeout: 1500 });
    assert.equal(await page.locator(`[data-country="${target}"]`).evaluate(el => el.style.fill), 'rgb(16, 185, 129)');
    assert.deepEqual(hint, { animations: 1, left: '180px', top: '260px' }, 'Blocked clicks should show one clock at the click position');

    // A wrong guess followed immediately by the right one must be rate-limited,
    // then accepted after a short pause. Clicking ignored inputs must not extend the pause.
    const nextTarget = (await page.locator('.name-panel').textContent()).trim();
    const wrongNext = ['France', 'Germany', 'Spain'].find(name => name !== target && name !== nextTarget);
    const nextFlag = await flag.getAttribute('src');
    await page.evaluate(({ nextTarget, wrongNext }) => {
      for (const name of [wrongNext, nextTarget]) document.querySelector(`[data-country="${name}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 280 }));
    }, { nextTarget, wrongNext });
    assert.equal(await flag.getAttribute('src'), nextFlag);
    assert.notEqual(await page.locator(`[data-country="${nextTarget}"]`).evaluate(el => el.style.fill), 'rgb(16, 185, 129)');
    await page.waitForTimeout(275);
    await page.locator(`[data-country="${nextTarget}"]`).dispatchEvent('click');
    // Skip cannot cancel or advance an already accepted answer.
    await page.getByRole('button', { name: translations.en.gameHUD.skip, exact: true }).dispatchEvent('click');
    await page.waitForFunction(({ alt, before }) => document.querySelector(`img[alt="${alt}"]`)?.getAttribute('src') !== before,
      { alt: translations.en.gameHUD.flagToMatchAlt, before: nextFlag }, { timeout: 1500 });
    assert.equal(await page.locator(`[data-country="${nextTarget}"]`).evaluate(el => el.style.fill), 'rgb(16, 185, 129)');
    // Repeated skips still advance exactly one target and finish this three-country round.
    await page.getByRole('button', { name: translations.en.gameHUD.skip, exact: true }).evaluate(button => {
      for (let i = 0; i < 20; i++) button.click();
    });
    const newGame = page.getByRole('button', { name: `🎮 ${translations.en.gameHUD.newGame}`, exact: true });
    await newGame.waitFor();
    assert.equal(await page.locator('[data-country]').evaluateAll(elements => elements.filter(el => el.style.fill === 'rgb(16, 185, 129)').length), 2);
    await newGame.click();
    // Switching regions during an accepted answer must cancel the old round's timer.
    await page.evaluate(() => {
      const name = document.querySelector('.name-panel').textContent.trim();
      document.querySelector(`[data-country="${name}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      history.pushState({}, '', '/en/game/flags/europe');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(450);
    assert.equal(await page.locator('[data-country]').evaluateAll(elements => elements.filter(el => el.style.fill === 'rgb(16, 185, 129)').length), 0);
    // Finish a clean round despite spamming after every correct answer, including the last one.
    for (let i = 0; i < 3; i++) {
      const previous = await flag.getAttribute('src');
      await page.evaluate(() => {
        const name = document.querySelector('.name-panel').textContent.trim();
        const correct = document.querySelector(`[data-country="${name}"]`);
        correct.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 20; i++) correct.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      if (i < 2) await page.waitForFunction(({ alt, before }) => document.querySelector(`img[alt="${alt}"]`)?.getAttribute('src') !== before,
        { alt: translations.en.gameHUD.flagToMatchAlt, before: previous }, { timeout: 1500 });
      else await page.locator('.win-animation-overlay').waitFor();
    }
    // Tiny island markers must take the same guarded click path as country polygons.
    fixtureCodes = ['MT'];
    await page.goto(`${origin}/en/game/flags/world`);
    await page.getByAltText(translations.en.gameHUD.flagToMatchAlt).waitFor();
    await page.locator('circle[data-country="Malta"]').evaluate(marker => {
      for (let i = 0; i < 20; i++) marker.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 280 }));
    });
    await page.locator('.win-animation-overlay').waitFor();
    console.log(`[flag-match] PASS ${width}px spam, cooldown, clock, skip, region reset, victory and island marker`);
  } catch (error) {
    await fs.mkdir(artifactDir, { recursive: true });
    await page.screenshot({ path: path.join(artifactDir, `flag-match-${width}.png`) }).catch(() => {});
    throw new Error(`flag-match/${width}: ${error.message}`, { cause: error });
  } finally {
    await context.close();
  }
}

try {
  // Serialize the production app exactly as the SEO renderer does, in memory.
  // This keeps the regression fast and leaves the real build/sitemap untouched.
  const context = await browser.newContext();
  try {
    await interceptNetwork(context);
    await context.addInitScript(() => { window.__WORLD_QUIZ_PRERENDER__ = true; });
    const page = await context.newPage();
    for (const pathname of languages.flatMap((language) => [`/${language}`, `/${language}/leaderboards`])) {
      await page.goto(`${origin}${pathname}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__WORLD_QUIZ_APP_MOUNTED__ &&
        [...document.querySelectorAll('[data-prerender-state]')].length > 0 &&
        [...document.querySelectorAll('[data-prerender-state]')].every((node) => node.getAttribute('data-prerender-state') === 'ready'));
      snapshots.set(pathname, await page.content());
    }
  } finally {
    await context.close();
  }
  const cases = languages.flatMap((language) => widths.map((width) => ({ language, width })));
  for (const { language, width } of cases) await checkStaticPaint(language, width);
  console.log(`[auth-ui] PASS ${cases.length} prerender first paints with JavaScript disabled`);
  const leaderboardWidths = [...new Set([Math.min(...widths), Math.max(...widths)])];
  for (const language of languages) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      await interceptNetwork(context);
      const page = await context.newPage();
      await page.goto(`${origin}/${language}/leaderboards?game=cards-match&period=all-time`);
      assert(await page.locator('.leaderboards-title').isVisible(), 'Prerender hid the whole leaderboard page');
      assert(!await page.locator('.game-mode-selector').isVisible(), 'Prerender flashed its default game before reading the URL');
      assert(!await page.locator('.leaderboards-grid').isVisible(), 'Prerender flashed its default period before reading the URL');
    } finally {
      await context.close();
    }
  }
  const tasks = [
    ...cases.flatMap(({ language, width }) => [false, true].map((authenticated) => () => checkRestoration(language, width, authenticated))),
    ...languages.flatMap((language) => leaderboardWidths.map((width) => () => checkLeaderboard(language, width))),
    ...leaderboardWidths.map(width => () => checkFlagMatchSpam(width)),
  ];
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < tasks.length) await tasks[cursor++]();
  }));
  console.log(`[ui] Passed ${cases.length} auth static paints, ${cases.length * 4} auth loads, ${languages.length} neutral leaderboard snapshots, ${languages.length * leaderboardWidths.length} leaderboard workflows and ${leaderboardWidths.length} Flag Match spam workflows. All external traffic intercepted.`);
} catch (error) {
  console.error(`[ui] FAILED ${error.stack}\nScreenshots: ${artifactDir}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
