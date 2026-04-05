import type { GenerationPayload } from "./types";
import { renderDetailDocument } from "./render-html";

const WIDTH = 800;

const DEFAULT_CHROMIUM_PACK_X64 =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

function isServerless(): boolean {
  return (
    process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
  );
}

async function screenshotWithPuppeteerServerless(html: string): Promise<Buffer> {
  const chromium = (await import("@sparticuz/chromium")).default;
  chromium.setGraphicsMode = false;

  const packUrl =
    process.env.CHROMIUM_PACK_URL?.trim() || DEFAULT_CHROMIUM_PACK_X64;

  const executablePath = await chromium.executablePath(packUrl);

  const puppeteer = await import("puppeteer-core");

  const browser = await puppeteer.default.launch({
    args: puppeteer.default.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: {
      width: WIDTH,
      height: 900,
      deviceScaleFactor: 2,
    },
    executablePath,
    headless: "shell",
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 90_000,
    });
    const buf = await page.screenshot({
      type: "png",
      fullPage: true,
      captureBeyondViewport: true,
    });
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}

async function screenshotWithPlaywrightLocal(html: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle", timeout: 90_000 });
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

export async function renderDetailPageToPng(
  payload: GenerationPayload,
): Promise<Buffer> {
  const html = renderDetailDocument(payload, WIDTH);

  if (isServerless()) {
    return screenshotWithPuppeteerServerless(html);
  }
  return screenshotWithPlaywrightLocal(html);
}
