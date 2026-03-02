import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getOrderById } from "../../../lib/orders-store";
import {
  getBouquetSvgMarkup,
  MAX_MESSAGE_LENGTH,
  normalizeBouquetId,
} from "../../../lib/preview-card";
import PreviewActions from "./PreviewActions";

export const dynamic = "force-dynamic";
const PAPER_MIN_HEIGHT = 400;
const BACK_CARD_OFFSET = 30;

const previewHtmlPath = path.join(process.cwd(), "public", "bloom-preview.html");
const previewHtml = fs.readFileSync(previewHtmlPath, "utf8");

function extractPart(regex, label) {
  const match = previewHtml.match(regex);
  if (!match) {
    throw new Error(`Could not extract ${label} from public/bloom-preview.html`);
  }
  return match[1].trim();
}

const previewStyles = extractPart(/<style>([\s\S]*?)<\/style>/i, "styles");
const extraPreviewStyles = `
  :root {
    --preview-back-card: #eee7db;
    --preview-front-card: #faf7f0;
    --letter-rule: 38px;
  }

  body {
    padding: 0;
    gap: 0;
    justify-content: flex-start;
  }

  .preview-shell {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 48px 24px 28px;
  }

  .preview-main {
    width: 100%;
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }

  .actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: center;
  }

  .postcard-stage {
    width: 100%;
    max-width: 1020px;
    padding: 20px 24px 26px;
    display: flex;
    justify-content: center;
    background: transparent;
  }

  .postcard {
    width: 100%;
    max-width: 930px;
    min-height: var(--paper-height, 400px);
    display: block;
    position: relative;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }

  .postcard::after {
    display: none;
  }

  .postcard-bouquet {
    width: 100%;
    min-height: calc(var(--paper-height, 400px) - var(--back-card-offset, 30px));
    background: var(--preview-back-card);
    padding: 38px 34px 34px 42px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    border: 1px solid rgba(90, 90, 82, 0.08);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.04),
      0 8px 32px rgba(0,0,0,0.08);
  }

  .bouquet-stamp {
    width: 50%;
    height: 100%;
    padding: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .bouquet-svg {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bouquet-svg svg {
    width: 100%;
    max-width: 100%;
    height: auto;
    display: block;
  }

  .postcard-letter {
    position: absolute;
    top: 18px;
    left: 50%;
    width: 50%;
    min-height: var(--paper-height, 400px);
    background-color: var(--stamp-frame);
    background-color: var(--preview-front-card);
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent calc(var(--letter-rule) - 1px),
      rgba(216,210,196,0.32) calc(var(--letter-rule) - 1px),
      rgba(216,210,196,0.32) var(--letter-rule)
    );
    background-position: 0 0;
    padding: 38px 42px 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border: 1px solid rgba(90, 90, 82, 0.1);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.04),
      0 16px 36px rgba(0,0,0,0.08);
    transform: rotate(-2.2deg);
    transform-origin: top center;
  }

  .postcard-letter::before {
    content: "";
    position: absolute;
    top: -28px;
    right: 34px;
    width: 26px;
    height: 86px;
    border: 3px solid rgba(132, 133, 136, 0.95);
    border-radius: 16px;
    background: transparent;
    pointer-events: none;
  }

  .postcard-credit {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
    text-align: center;
    margin-top: 28px;
  }

  .letter-body {
    gap: 0;
  }

  .letter-to {
    font-size: 14px;
    line-height: var(--letter-rule);
    min-height: var(--letter-rule);
    text-transform: none;
  }

  .letter-message {
    line-height: var(--letter-rule);
  }

  .letter-footer {
    margin-top: auto;
    padding-bottom: calc(9px - var(--letter-rule));
  }

  .letter-from {
    display: flex;
    align-items: center;
    line-height: var(--letter-rule);
    min-height: var(--letter-rule);
    margin-top: 0;
    padding-top: 18px;
  }

  .postcard-credit a {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid rgba(90, 90, 82, 0.35);
    transition: color 0.15s, border-color 0.15s;
  }

  .postcard-credit a:hover {
    color: var(--dark);
    border-color: var(--dark);
  }

  @media (max-width: 640px) {
    .preview-shell {
      padding: 24px 16px 40px;
    }

    .preview-main {
      gap: 24px;
    }

    .actions-row {
      gap: 12px;
    }

    .postcard-stage {
      padding: 14px;
      max-width: 440px;
    }

    .postcard {
      min-height: auto;
      padding-bottom: 34px;
      position: relative;
    }

    .postcard::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--preview-back-card);
      border: 1px solid rgba(90, 90, 82, 0.08);
      box-shadow:
        0 2px 4px rgba(0,0,0,0.04),
        0 8px 32px rgba(0,0,0,0.08);
      z-index: 0;
    }

    .postcard-bouquet {
      width: 100%;
      min-height: 350px;
      height: 350px;
      padding: 24px 22px 0;
      background: transparent;
      border: none;
      box-shadow: none;
      align-items: center;
      justify-content: flex-start;
      position: relative;
      z-index: 1;
    }

    .bouquet-stamp {
      width: 100%;
      height: 100%;
    }

    .bouquet-svg {
      width: 100%;
      height: 100%;
    }

    .bouquet-svg svg {
      width: auto;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }

    .postcard-letter {
      position: relative;
      top: auto;
      right: auto;
      left: auto;
      width: calc(100% - 22px);
      min-height: auto;
      margin: -34px 0 0 auto;
      padding: 32px 28px 28px;
      transform: rotate(-1.25deg);
      background-position: 0 0;
      z-index: 2;
    }

    .postcard-letter::before {
      top: 18px;
      right: 18px;
      width: 22px;
      height: 74px;
      border-radius: 14px;
      transform: rotate(90deg);
      transform-origin: center center;
    }
  }
`;

function estimateDesktopMessageLines(message) {
  const normalized = String(message || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return 1;

  return normalized.split("\n").reduce((total, paragraph) => {
    const lineCount = Math.max(1, Math.ceil(paragraph.length / 26));
    return total + lineCount;
  }, 0);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const order = await getOrderById(id);

  if (!order) {
    return {
      title: "Petalpost Preview",
      description: "A bouquet and letter preview from Petalpost.",
    };
  }

  const previewTitle = `A bouquet for ${order.to}`;
  const previewDescription =
    String(order.message || "").trim().slice(0, 140) ||
    `A bouquet and note from ${order.from}.`;

  return {
    title: previewTitle,
    description: previewDescription,
    openGraph: {
      title: previewTitle,
      description: previewDescription,
      images: [`/bouquet/${encodeURIComponent(id)}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: previewTitle,
      description: previewDescription,
      images: [`/bouquet/${encodeURIComponent(id)}/opengraph-image`],
    },
  };
}

export default async function PreviewPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) notFound();

  const order = await getOrderById(id);
  if (!order) notFound();

  const bouquetId = normalizeBouquetId(order.bouquet_id);
  const bouquetSvg = getBouquetSvgMarkup(bouquetId, order.colors);
  const safeMessage = String(order.message || "").slice(0, MAX_MESSAGE_LENGTH);
  const estimatedLines = estimateDesktopMessageLines(safeMessage);
  const extraLines = Math.max(0, estimatedLines - 8);
  const extraHeight = extraLines * 38;
  const paperHeight = PAPER_MIN_HEIGHT + extraHeight;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
      <style dangerouslySetInnerHTML={{ __html: extraPreviewStyles }} />
      <div className="preview-shell">
        <div className="preview-main">
          <PreviewActions />

          <div className="postcard-stage" id="postcard-canvas">
            <div
              className="postcard"
              id="postcard"
              style={{
                "--paper-height": `${paperHeight}px`,
                "--back-card-offset": `${BACK_CARD_OFFSET}px`,
              }}
            >
              <div className="postcard-bouquet">
                <div className="bouquet-stamp">
                  <div className="bouquet-svg" dangerouslySetInnerHTML={{ __html: bouquetSvg }} />
                </div>
              </div>

              <div className="postcard-letter">
                <div className="letter-body">
                  <div className="letter-to">For {order.to}</div>
                  <div className="letter-message">{safeMessage}</div>
                </div>

                <div className="letter-footer">
                  <div className="letter-from">
                    <span>With love, {order.from}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="postcard-credit">
          Petalpost built by{" "}
          <a href="https://matea.fyi" target="_blank" rel="noreferrer">
            Matea from SunHouse Studio
          </a>
        </p>
      </div>
    </>
  );
}
