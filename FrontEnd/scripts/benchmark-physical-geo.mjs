import { chromium } from "playwright-core";

const BASE_URL = "http://127.0.0.1:4173";

const MODES = ["mountains", "rivers", "waters", "deserts"];
const VIEWPORTS = [
  { name: "Desktop (1920x1080)", width: 1920, height: 1080, isMobile: false, hasTouch: false },
  { name: "Mobile (390x844)", width: 390, height: 844, isMobile: true, hasTouch: true },
];

async function run() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  console.log("================================================================================");
  console.log("PHYSICAL GEOGRAPHY DEEP CDP BENCHMARK");
  console.log("================================================================================");

  for (const vp of VIEWPORTS) {
    console.log(`\n\n--- VIEWPORT: ${vp.name} ---`);

    for (const mode of MODES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
      });

      const page = await context.newPage();
      const client = await context.newCDPSession(page);

      // Enable CDP domains
      await client.send("Performance.enable");
      await client.send("DOM.enable");
      await client.send("CSS.enable");

      const url = `${BASE_URL}/game/physical-geo/${mode}`;
      const startTime = performance.now();
      await page.goto(url, { waitUntil: "networkidle" });

      // Wait for map and features to render
      await page.waitForSelector("svg", { timeout: 10000 });
      // Wait an extra 800ms for workers and dynamic layers to settle
      await page.waitForTimeout(800);
      const loadDuration = Math.round(performance.now() - startTime);

      // Measure DOM and SVG stats
      const domStats = await page.evaluate(() => {
        const allNodes = document.querySelectorAll("*").length;
        const svgPaths = document.querySelectorAll("path").length;
        const svgCircles = document.querySelectorAll("circle").length;
        const svgGroups = document.querySelectorAll("g").length;
        const svgSvgs = document.querySelectorAll("svg").length;

        // Path lengths
        let totalDLength = 0;
        let longestDLength = 0;
        document.querySelectorAll("path").forEach((p) => {
          const d = p.getAttribute("d") || "";
          totalDLength += d.length;
          if (d.length > longestDLength) longestDLength = d.length;
        });

        // Bounding boxes
        const skipBtn = document.querySelector("button[title*='přeskočit' i], button[title*='skip' i]");
        let skipRect = null;
        if (skipBtn) {
          const r = skipBtn.getBoundingClientRect();
          skipRect = { width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 };
        }

        const mapWrapper = document.querySelector("[aria-label*='mapa' i], [aria-label*='map' i]") || document.querySelector("svg")?.parentElement;
        let mapRect = null;
        if (mapWrapper) {
          const r = mapWrapper.getBoundingClientRect();
          mapRect = { width: Math.round(r.width), height: Math.round(r.height) };
        }

        // Clickable interactive features
        const clickables = Array.from(document.querySelectorAll("path, circle")).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.cursor === "pointer" || style.pointerEvents === "all" || style.pointerEvents === "stroke";
        });

        let minClickable = null;
        let maxClickable = null;
        let sampleClickables = [];

        clickables.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            const area = r.width * r.height;
            if (!minClickable || area < minClickable.area) {
              minClickable = { width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10, area };
            }
            if (!maxClickable || area > maxClickable.area) {
              maxClickable = { width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10, area };
            }
            if (sampleClickables.length < 5) {
              sampleClickables.push({ tag: el.tagName, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 });
            }
          }
        });

        return {
          allNodes,
          svgPaths,
          svgCircles,
          svgGroups,
          svgSvgs,
          totalDLength,
          longestDLength,
          skipRect,
          mapRect,
          clickableCount: clickables.length,
          minClickable,
          maxClickable,
          sampleClickables,
        };
      });

      // Memory & Performance metrics via CDP
      const perfMetrics = await client.send("Performance.getMetrics");
      const metricsObj = {};
      perfMetrics.metrics.forEach((m) => {
        metricsObj[m.name] = m.value;
      });

      // Panning stress test: simulate 30 drag steps across map and measure FPS/frame duration
      const mapBox = domStats.mapRect;
      const startX = mapBox.width / 2;
      const startY = mapBox.height / 2;

      const panResult = await page.evaluate(async ({ startX, startY }) => {
        const svg = document.querySelector("svg");
        if (!svg) return { fps: 0, droppedFrames: 0 };

        const frameTimes = [];
        let lastTime = performance.now();
        let rafId;

        const loop = (t) => {
          frameTimes.push(t - lastTime);
          lastTime = t;
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        // Dispatch pointer events for dragging
        const dispatch = (type, x, y) => {
          const ev = new PointerEvent(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            isPrimary: true,
            button: 0,
            buttons: type === "pointerup" ? 0 : 1,
          });
          svg.dispatchEvent(ev);
        };

        dispatch("pointerdown", startX, startY);
        for (let i = 0; i < 40; i++) {
          const nx = startX + Math.sin(i / 5) * 80;
          const ny = startY + Math.cos(i / 5) * 80;
          dispatch("pointermove", nx, ny);
          await new Promise((r) => setTimeout(r, 16));
        }
        dispatch("pointerup", startX, startY);

        cancelAnimationFrame(rafId);
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
        const fps = Math.round(1000 / avgFrameTime);
        const droppedFrames = frameTimes.filter((dt) => dt > 33).length; // frames slower than 30fps

        return { fps, avgFrameTime: Math.round(avgFrameTime * 10) / 10, droppedFrames, totalSampledFrames: frameTimes.length };
      }, { startX, startY });

      console.log(`\nMode: [${mode.toUpperCase()}]`);
      console.log(`- Load Time: ${loadDuration} ms`);
      console.log(`- DOM Nodes: Total=${domStats.allNodes}, Paths=${domStats.svgPaths}, Groups=${domStats.svgGroups}, Circles=${domStats.svgCircles}`);
      console.log(`- Total 'd' Path Characters: ${domStats.totalDLength.toLocaleString()} (Longest: ${domStats.longestDLength.toLocaleString()})`);
      console.log(`- JS Heap: Used=${((metricsObj.JSHeapUsedSize || 0) / (1024 * 1024)).toFixed(1)} MB, Total=${((metricsObj.JSHeapTotalSize || 0) / (1024 * 1024)).toFixed(1)} MB`);
      console.log(`- Layout Recalcs: ${metricsObj.LayoutCount || 0} (${Math.round((metricsObj.LayoutDuration || 0) * 1000)} ms total)`);
      console.log(`- Skip Button Size: ${domStats.skipRect ? `${domStats.skipRect.width} × ${domStats.skipRect.height} px` : "N/A"}`);
      console.log(`- Map Container Size: ${domStats.mapRect ? `${domStats.mapRect.width} × ${domStats.mapRect.height} px` : "N/A"}`);
      console.log(`- Clickable Targets Count: ${domStats.clickableCount}`);
      console.log(`- Smallest Tap Target: ${domStats.minClickable ? `${domStats.minClickable.width} × ${domStats.minClickable.height} px` : "N/A"}`);
      console.log(`- Largest Tap Target: ${domStats.maxClickable ? `${domStats.maxClickable.width} × ${domStats.maxClickable.height} px` : "N/A"}`);
      console.log(`- Panning Drag Performance: ${panResult.fps} FPS, avgFrameTime=${panResult.avgFrameTime} ms, jankyFrames(>33ms)=${panResult.droppedFrames}/${panResult.totalSampledFrames}`);

      await context.close();
    }
  }

  await browser.close();
  console.log("\nBenchmark complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
