import { ImageResponse } from "next/og";
import { getOrderById } from "../../../lib/orders-store";
import {
  buildBouquetSvgDataUri,
  MAX_MESSAGE_LENGTH,
  normalizeBouquetId,
} from "../../../lib/preview-card";

export const runtime = "nodejs";
export const alt = "FlowerNote bouquet preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function buildPreviewLines(message, maxLines = 4, maxCharsPerLine = 42) {
  const words = String(message || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH)
    .split(" ")
    .filter(Boolean);

  if (!words.length) return ["For you - because some days deserve flowers."];

  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  const usedWords = lines.join(" ").split(" ").filter(Boolean).length;
  if (usedWords < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?-]?$/, "")}...`;
  }

  return lines;
}

export default async function OpenGraphImage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const order = await getOrderById(id);

  const to = order?.to || "Friend";
  const from = order?.from || "Someone";
  const bouquetId = normalizeBouquetId(order?.bouquet_id);
  const bouquetSrc = buildBouquetSvgDataUri(bouquetId, order?.colors);
  const messageLines = buildPreviewLines(order?.message);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          background: "#f4ecf0",
          padding: "28px 36px",
          color: "#1c2626",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "40px 36px 0 36px",
            display: "flex",
            background: "#eee7db",
            border: "1px solid rgba(90,90,82,0.08)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "76px",
            top: "58px",
            width: "500px",
            height: "504px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={bouquetSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: "620px",
            top: "56px",
            width: "520px",
            minHeight: "470px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#faf7f0",
            border: "1px solid rgba(90,90,82,0.10)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.08)",
            padding: "42px 40px 30px",
            transform: "rotate(-2.2deg)",
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 37px, rgba(216,210,196,0.32) 37px, rgba(216,210,196,0.32) 38px)",
            backgroundPosition: "0 42px",
            backgroundSize: "100% 38px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-24px",
              right: "32px",
              width: "24px",
              height: "84px",
              border: "3px solid rgba(132,133,136,0.95)",
              borderRadius: "16px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "16px",
                lineHeight: "38px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#5a5a52",
              }}
            >
              For {to}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "4px",
              }}
            >
              {messageLines.map((line, index) => (
                <div
                  key={`${index}-${line}`}
                  style={{
                    display: "flex",
                    fontFamily: "Georgia, serif",
                    fontSize: "28px",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: "38px",
                    color: "#1c2626",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              lineHeight: "38px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#5a5a52",
            }}
          >
            <div style={{ display: "flex" }}>With love, {from}</div>
            <div style={{ display: "flex", color: "#cfc6b7" }}>FlowerNote</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
