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

export default function PreviewActions() {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
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

    const rect = postcard.getBoundingClientRect();
    const padding = 56;
    const creditHeight = 68;
    const side = Math.ceil(
      Math.max(rect.width + padding * 2, rect.height + padding * 2 + creditHeight),
    );
    const exportFrame = document.createElement("div");

    exportFrame.style.position = "fixed";
    exportFrame.style.left = "-99999px";
    exportFrame.style.top = "0";
    exportFrame.style.width = `${side}px`;
    exportFrame.style.height = `${side}px`;
    exportFrame.style.display = "flex";
    exportFrame.style.flexDirection = "column";
    exportFrame.style.alignItems = "center";
    exportFrame.style.justifyContent = "center";
    exportFrame.style.gap = "20px";
    exportFrame.style.background = DEFAULT_BACKGROUND;
    exportFrame.style.padding = `${padding}px`;
    exportFrame.style.boxSizing = "border-box";

    const postcardClone = postcard.cloneNode(true);
    postcardClone.removeAttribute("id");
    postcardClone.style.flex = "0 0 auto";
    exportFrame.appendChild(postcardClone);

    const credit = document.createElement("div");
    credit.style.display = "flex";
    credit.style.flexDirection = "column";
    credit.style.alignItems = "center";
    credit.style.justifyContent = "center";
    credit.style.gap = "4px";
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
    creditUrl.style.fontFamily = '"Cormorant Garamond", serif';
    creditUrl.style.fontSize = "20px";
    creditUrl.style.fontWeight = "400";
    creditUrl.style.lineHeight = "1";
    creditUrl.style.fontStyle = "italic";
    creditUrl.style.color = "#1c2626";

    credit.appendChild(creditLine);
    credit.appendChild(creditUrl);
    exportFrame.appendChild(credit);
    document.body.appendChild(exportFrame);

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

    const link = document.createElement("a");
    link.download = "flowernote-letter.png";
    link.href = canvas.toDataURL("image/png");
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
        
        <span className="copy-toast-text">Copied! Your FlowerNote is ready to share.</span>
      </div>
    </div>
  );
}
