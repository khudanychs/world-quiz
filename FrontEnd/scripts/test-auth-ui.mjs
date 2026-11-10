import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const artifactDir = process.env.AUTH_UI_ARTIFACT_DIR || path.join(os.tmpdir(), `world-quiz-auth-ui-${process.pid}`);
const widths = (process.env.AUTH_UI_TEST_WIDTHS || '320,390,1119,1120,1280,1440').split(',').map(Number);
const languages = (process.env.AUTH_UI_TEST_LANGUAGES || 'en,cs,de').split(',');
const executablePath = process.env.PRERENDER_CHROME_PATH || '/usr/bin/google-chrome';
const snapshots = new Map();
const fixtureUid = 'local-auth-ui-fixture';
const fixtureName = 'VeryLongNicknameForLayoutTesting';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

assert(widths.every((width) => Number.isInteger(width) && width >= 320), 'Invalid test viewport width');
assert(languages.every((language) => ['en', 'cs', 'de'].includes(language)), 'Invalid test language');
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

try {
  // Serialize the production app exactly as the SEO renderer does, in memory.
  // This keeps the regression fast and leaves the real build/sitemap untouched.
  const context = await browser.newContext();
  try {
    await interceptNetwork(context);
    await context.addInitScript(() => { window.__WORLD_QUIZ_PRERENDER__ = true; });
    const page = await context.newPage();
    for (const language of languages) {
      await page.goto(`${origin}/${language}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__WORLD_QUIZ_APP_MOUNTED__ &&
        [...document.querySelectorAll('[data-prerender-state]')].length > 0 &&
        [...document.querySelectorAll('[data-prerender-state]')].every((node) => node.getAttribute('data-prerender-state') === 'ready'));
      snapshots.set(`/${language}`, await page.content());
    }
  } finally {
    await context.close();
  }
  const cases = languages.flatMap((language) => widths.map((width) => ({ language, width })));
  for (const { language, width } of cases) await checkStaticPaint(language, width);
  console.log(`[auth-ui] PASS ${cases.length} prerender first paints with JavaScript disabled`);
  const tasks = cases.flatMap(({ language, width }) => [false, true].map((authenticated) => () => checkRestoration(language, width, authenticated)));
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < tasks.length) await tasks[cursor++]();
  }));
  console.log(`[auth-ui] Passed ${cases.length} static paints and ${tasks.length * 2} delayed/uncached auth loads. All external traffic intercepted.`);
} catch (error) {
  console.error(`[auth-ui] FAILED ${error.stack}\nScreenshots: ${artifactDir}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
