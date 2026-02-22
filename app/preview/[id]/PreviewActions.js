"use client";

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
  async function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("Link copied!"))
      .catch(() => {});
  }

  async function downloadImage() {
    const html2canvas = await ensureHtml2Canvas();
    const canvas = await html2canvas(document.getElementById("postcard"), {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement("a");
    link.download = "bloom-letter.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="actions">
      <button className="btn-ghost" onClick={() => window.history.back()}>
        {"\u2190"} Back
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
  );
}
