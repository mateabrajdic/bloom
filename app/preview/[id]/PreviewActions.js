"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_BACKGROUND = "#f9eef0";
const EXPORT_CREDIT = "FlowerNote built by Matea from SunHouse Studio";
const EXPORT_URL = "www.flowernote.online";

async function ensureHtml2Canvas() {
  if (window.html2canvas) return window.html2canvas;

  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  document.head.appendChild(script);
  await new Promise((resolve) => {
    script.onload = resolve;
  });

  return window.html2canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export default function PreviewActions() {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const copiedTimerRef = useRef(null);
  const savingTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
      if (savingTimerRef.current) {
        window.clearTimeout(savingTimerRef.current);
      }
    };
  }, []);

  async function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        if (copiedTimerRef.current) {
          window.clearTimeout(copiedTimerRef.current);
        }
        copiedTimerRef.current = window.setTimeout(() => {
          setCopied(false);
        }, 2200);
      })
      .catch(() => {});
  }

  async function downloadImage() {
    const html2canvas = await ensureHtml2Canvas();
    const postcard = document.getElementById("postcard");
    if (!postcard) return;
    const isMobileExport = window.matchMedia("(max-width: 640px)").matches;
    const SAVE_TOAST_DURATION = 2400;
    const exportWindow = isMobileExport ? window.open("about:blank", "_blank") : null;

    setSaving(true);
    if (savingTimerRef.current) {
      window.clearTimeout(savingTimerRef.current);
    }
    savingTimerRef.current = window.setTimeout(() => {
      setSaving(false);
    }, SAVE_TOAST_DURATION);

    if (isMobileExport && exportWindow) {
      exportWindow.document.title = "FlowerNote Image";
      exportWindow.document.body.style.margin = "0";
      exportWindow.document.body.style.minHeight = "100vh";
      exportWindow.document.body.style.display = "flex";
      exportWindow.document.body.style.flexDirection = "column";
      exportWindow.document.body.style.alignItems = "center";
      exportWindow.document.body.style.justifyContent = "center";
      exportWindow.document.body.style.background = DEFAULT_BACKGROUND;
      exportWindow.document.body.style.fontFamily = '"DM Sans", sans-serif';
      exportWindow.document.body.style.color = "#5a5a52";
      exportWindow.document.body.style.padding = "32px";
      exportWindow.document.body.style.boxSizing = "border-box";
      exportWindow.document.body.style.textAlign = "center";
      exportWindow.document.body.innerHTML =
        "<div>Preparing image...</div><div>When it loads, long press to save to gallery.</div>";
    }

    const rect = postcard.getBoundingClientRect();
    const padding = isMobileExport ? 24 : 56;
    const creditHeight = isMobileExport ? 56 : 68;
    const exportWidth = isMobileExport ? 408 : Math.ceil(
      Math.max(rect.width + padding * 2, rect.height + padding * 2 + creditHeight),
    );
    const exportFrame = document.createElement("div");

    exportFrame.style.position = "fixed";
    exportFrame.style.left = "-99999px";
    exportFrame.style.top = "0";
    exportFrame.style.width = `${exportWidth}px`;
    exportFrame.style.display = "flex";
    exportFrame.style.flexDirection = "column";
    exportFrame.style.alignItems = "center";
    exportFrame.style.justifyContent = "flex-start";
    exportFrame.style.gap = "20px";
    exportFrame.style.background = DEFAULT_BACKGROUND;
    exportFrame.style.padding = `${padding}px`;
    exportFrame.style.boxSizing = "border-box";

    const postcardClone = postcard.cloneNode(true);
    postcardClone.removeAttribute("id");
    postcardClone.querySelector(".letter-brand")?.remove();
    postcardClone.querySelector(".postcard-credit")?.remove();
    postcardClone.style.flex = "0 0 auto";

    if (isMobileExport) {
      postcardClone.style.width = "360px";
      postcardClone.style.maxWidth = "100%";
      postcardClone.style.minHeight = "auto";
      postcardClone.style.paddingBottom = "34px";

      const bouquetCard = postcardClone.querySelector(".postcard-bouquet");
      if (bouquetCard) {
        bouquetCard.style.minHeight = "350px";
        bouquetCard.style.height = "350px";
        bouquetCard.style.padding = "24px 22px 0";
        bouquetCard.style.background = "transparent";
        bouquetCard.style.border = "none";
        bouquetCard.style.boxShadow = "none";
        bouquetCard.style.alignItems = "center";
        bouquetCard.style.justifyContent = "flex-start";
      }

      const bouquetStamp = postcardClone.querySelector(".bouquet-stamp");
      if (bouquetStamp) {
        bouquetStamp.style.width = "100%";
        bouquetStamp.style.height = "100%";
      }

      const bouquetSvg = postcardClone.querySelector(".bouquet-svg");
      if (bouquetSvg) {
        bouquetSvg.style.width = "100%";
        bouquetSvg.style.height = "100%";
      }

      const bouquetSvgInner = postcardClone.querySelector(".bouquet-svg svg");
      if (bouquetSvgInner) {
        bouquetSvgInner.style.width = "auto";
        bouquetSvgInner.style.height = "100%";
        bouquetSvgInner.style.maxWidth = "100%";
        bouquetSvgInner.style.maxHeight = "100%";
      }

      const letterCard = postcardClone.querySelector(".postcard-letter");
      if (letterCard) {
        letterCard.style.position = "relative";
        letterCard.style.top = "auto";
        letterCard.style.left = "auto";
        letterCard.style.right = "auto";
        letterCard.style.width = "calc(100% - 22px)";
        letterCard.style.minHeight = "auto";
        letterCard.style.margin = "-34px 0 0 auto";
        letterCard.style.padding = "32px 28px 28px";
        letterCard.style.transform = "rotate(-1.25deg)";
        letterCard.style.backgroundPosition = "0 0";
      }
    }

    exportFrame.appendChild(postcardClone);

    const credit = document.createElement("div");
    credit.style.display = "flex";
    credit.style.flexDirection = "column";
    credit.style.alignItems = "center";
    credit.style.justifyContent = "center";
    credit.style.gap = "8px";
    credit.style.flex = "0 0 auto";
    credit.style.color = "#5a5a52";
    credit.style.textAlign = "center";

    const creditLine = document.createElement("div");
    creditLine.textContent = EXPORT_CREDIT;
    creditLine.style.fontFamily = '"DM Sans", sans-serif';
    creditLine.style.fontSize = "10px";
    creditLine.style.fontWeight = "500";
    creditLine.style.letterSpacing = "0.14em";
    creditLine.style.textTransform = "uppercase";

    const creditUrl = document.createElement("div");
    creditUrl.textContent = EXPORT_URL;
    creditUrl.style.fontFamily = '"DM Sans", sans-serif';
    creditUrl.style.fontSize = "10px";
    creditUrl.style.fontWeight = "500";
    creditUrl.style.letterSpacing = "0.14em";
    creditUrl.style.lineHeight = "1";
    creditUrl.style.textTransform = "uppercase";

    credit.appendChild(creditLine);
    credit.appendChild(creditUrl);
    exportFrame.appendChild(credit);
    document.body.appendChild(exportFrame);
    exportFrame.style.height = isMobileExport
      ? `${Math.ceil(postcardClone.getBoundingClientRect().height + credit.getBoundingClientRect().height + padding * 2 + 20)}px`
      : `${exportWidth}px`;

    let canvas;
    try {
      canvas = await html2canvas(exportFrame, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
    } finally {
      document.body.removeChild(exportFrame);
    }

    if (isMobileExport && exportWindow) {
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        exportWindow.close();
        return;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, SAVE_TOAST_DURATION);
      });

      const imageUrl = URL.createObjectURL(blob);
      exportWindow.document.body.innerHTML = "";
      const img = exportWindow.document.createElement("img");
      img.src = imageUrl;
      img.alt = "FlowerNote letter";
      img.style.display = "block";
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.maxWidth = "100vw";
      exportWindow.document.body.appendChild(img);
      return;
    }

    const imageUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "flowernote-letter.png";
    link.href = imageUrl;
    link.click();
  }

  return (
    <div className="actions-row">
      <div className="actions">
        <button className="btn-ghost" onClick={() => (window.location.href = "/")}>
          {"\u2190"} Create another
        </button>
        <button className="btn" onClick={copyLink}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Share
        </button>
        <button className="btn" onClick={downloadImage}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save
        </button>
      </div>
      <div className={`copy-toast${copied ? " show" : ""}`} aria-live="polite">
        <span className="copy-toast-title">Link copied</span>
        <span className="copy-toast-text">Paste anywhere to share.</span>
      </div>
      <div className={`copy-toast${saving ? " show" : ""}`} aria-live="polite">
        <span className="copy-toast-title">Generating image</span>
        <span className="copy-toast-text">A new tab will open. Long press the image to save it.</span>
      </div>
    </div>
  );
}
