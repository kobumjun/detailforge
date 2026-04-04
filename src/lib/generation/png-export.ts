import type { GenerationPayload } from "./types";
import { renderDetailDocument } from "./render-html";

const VIEWPORT = { width: 800, height: 1200 };

export async function renderDetailPageToPng(
  payload: GenerationPayload,
): Promise<Buffer> {
  const html = renderDetailDocument(payload, VIEWPORT.width);

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { chromium: playwright } = await import("playwright-core");
    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage({
        viewport: { ...VIEWPORT, height: 800 },
        deviceScaleFactor: 2,
      });
      await page.setContent(html, { waitUntil: "networkidle", timeout: 60_000 });
      const buf = await page.screenshot({
        type: "png",
        fullPage: true,
        animations: "disabled",
      });
      return Buffer.from(buf);
    } finally {
      await browser.close();
    }
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { ...VIEWPORT, height: 800 },
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle", timeout: 60_000 });
    const buf = await page.screenshot({
      type: "png",
      fullPage: true,
      animations: "disabled",
    });
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}
