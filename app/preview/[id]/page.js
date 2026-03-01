import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getOrderById } from "../../../lib/orders-store";
import PreviewActions from "./PreviewActions";

export const dynamic = "force-dynamic";

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

const BOUQUET_META = {
  classic: { file: "classic.svg", label: "Classic Bouquet" },
  tropical: { file: "tropical.svg", label: "Tropical Bouquet" },
  wildflowers: { file: "wildflowers.svg", label: "Wildflower Bouquet" },
};

const BOUQUET_COLOR_GROUPS = {
  classic: {
    peonies: { ids: ["peony01", "peony02", "peony03"] },
    poppyA: { ids: ["poppy01", "poppy09"] },
    poppyB: { ids: ["poppy03", "poppy06"] },
    poppyC: { ids: ["poppy02", "poppy08"] },
    poppyD: { ids: ["poppy04", "poppy05", "poppy07"] },
    buttercups: { ids: ["buttercup01", "buttercup02", "buttercup03"] },
    ribbon: { ids: ["ribbon"], isGroup: true },
    wrapper: { ids: ["paper_wrap"] },
  },
  tropical: {
    protea: { ids: ["Protea01", "Protea02", "Protea03"] },
    ranunculus: { ids: ["Ranunculus01", "Ranunculus02"] },
    freesia: { ids: ["Freesia01", "Freesia02", "Freesia03", "Freesia04"] },
    daisy: { ids: ["Daisy01", "Daisy02", "Daisy03"] },
    ribbon: { ids: ["ribbon"] },
    wrapper: { ids: ["wrapper"] },
  },
  wildflowers: {
    marigold: { ids: ["Marigold"] },
    snowdrops: { ids: ["Snowdrop01", "Snowdrop02", "Snowdrop03", "Snowdrop04"] },
    gerbera: { ids: ["Gerbera"] },
    pansy: { ids: ["Pansy01", "Pansy02", "Pansy03"] },
    rudbeckia: { ids: ["Rudbeckia"] },
    ribbon: { ids: ["RIBBON"] },
  },
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFillInStyle(styleValue, color) {
  if (/(^|;)\s*fill\s*:/i.test(styleValue)) {
    return styleValue.replace(/(^|;)\s*fill\s*:[^;]*/i, `$1 fill: ${color}`);
  }

  const trimmed = styleValue.trim();
  if (!trimmed) return `fill: ${color};`;
  return `${trimmed.replace(/;?$/, ";")} fill: ${color};`;
}

function setFillOnTag(tag, color) {
  if (/\sstyle\s*=\s*['"]/i.test(tag)) {
    return tag.replace(/\sstyle\s*=\s*(["'])(.*?)\1/i, (full, quote, value) => {
      const updatedStyle = replaceFillInStyle(value, color);
      return ` style=${quote}${updatedStyle}${quote}`;
    });
  }

  if (/\sfill\s*=\s*['"]/i.test(tag)) {
    return tag.replace(/\sfill\s*=\s*(["']).*?\1/i, ` fill=\"${color}\"`);
  }

  if (tag.endsWith("/>")) {
    return `${tag.slice(0, -2)} style=\"fill: ${color};\"/>`;
  }

  return `${tag.slice(0, -1)} style=\"fill: ${color};\">`;
}

function setFillByElementId(svg, elementId, color) {
  const tagPattern = new RegExp(`(<[^>]*\\sid=["']${escapeRegExp(elementId)}["'][^>]*>)`);
  return svg.replace(tagPattern, (tag) => setFillOnTag(tag, color));
}

function setGroupFirstPathFill(svg, groupId, color) {
  const groupPattern = new RegExp(
    `(<g[^>]*\\sid=["']${escapeRegExp(groupId)}["'][^>]*>[\\s\\S]*?<\\/g>)`
  );

  return svg.replace(groupPattern, (groupMarkup) =>
    groupMarkup.replace(/<path\b[^>]*>/, (pathTag) => setFillOnTag(pathTag, color))
  );
}

function normalizeBouquetId(value) {
  const normalized = String(value || "wildflowers").toLowerCase();
  if (BOUQUET_META[normalized]) return normalized;
  return "wildflowers";
}

function applyColorOverrides(svgMarkup, bouquetId, colors) {
  const groups = BOUQUET_COLOR_GROUPS[bouquetId] || {};
  let updatedSvg = svgMarkup;

  for (const [groupKey, color] of Object.entries(colors || {})) {
    const group = groups[groupKey];
    if (!group) continue;

    for (const elementId of group.ids) {
      updatedSvg = setFillByElementId(updatedSvg, elementId, color);
      if (group.isGroup) {
        updatedSvg = setGroupFirstPathFill(updatedSvg, elementId, color);
      }
    }
  }

  return updatedSvg;
}

function getBouquetSvgMarkup(bouquetId, colors) {
  const chosenBouquetId = normalizeBouquetId(bouquetId);
  const fileName = BOUQUET_META[chosenBouquetId].file;
  const filePath = path.join(process.cwd(), "public", fileName);

  const sourceSvg = fs.readFileSync(filePath, "utf8");
  return applyColorOverrides(sourceSvg, chosenBouquetId, colors);
}

export default async function PreviewPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) notFound();

  const order = await getOrderById(id);
  if (!order) notFound();

  const bouquetId = normalizeBouquetId(order.bouquet_id);
  const bouquetLabel = BOUQUET_META[bouquetId].label;
  const bouquetSvg = getBouquetSvgMarkup(bouquetId, order.colors);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: previewStyles }} />

      <PreviewActions />

      <div className="postcard" id="postcard">
        <div className="postcard-bouquet">
          <div dangerouslySetInnerHTML={{ __html: bouquetSvg }} />
          <span className="bouquet-label">{bouquetLabel}</span>
        </div>

        <div className="postcard-letter">
          <div className="letter-body">
            <div className="letter-to">For {order.to}</div>
            <div className="letter-message">{order.message}</div>
          </div>

          <div className="letter-footer">
            <div className="letter-from">
              <span>With love, {order.from}</span>
              <span className="letter-brand">Bloom</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
