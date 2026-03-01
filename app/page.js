import fs from "node:fs";
import path from "node:path";
import BloomHomeClient from "./BloomHomeClient";

const bloomHtmlPath = path.join(process.cwd(), "public", "bloom.html");
const bloomHtml = fs.readFileSync(bloomHtmlPath, "utf8");

function extractPart(regex, label) {
  const match = bloomHtml.match(regex);
  if (!match) {
    throw new Error(`Could not extract ${label} from public/bloom.html`);
  }
  return match[1].trim();
}

const bloomStyles = extractPart(/<style>([\s\S]*?)<\/style>/i, "styles");
const bloomBody = extractPart(/<body>([\s\S]*?)<script>/i, "body markup");
const bloomRawScript = extractPart(/<script>([\s\S]*?)<\/script>\s*<\/body>/i, "script");

const sendBouquetOverride = `async function sendBouquet() {
  const from = document.getElementById('fromName').value.trim();
  const to = document.getElementById('toName').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!from || !to) { alert('Please fill in your name and the recipient\\'s name.'); return; }

  const bouquet = bouquets[currentIdx];
  const colors = bouquet.colorGroups.reduce((acc, group) => {
    acc[group.key] = group.color;
    return acc;
  }, {});

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        from,
        message,
        bouquet_id: bouquet.id,
        colors,
      }),
    });

    if (!res.ok) throw new Error('Failed to create order');

    const data = await res.json();
    if (!data || !data.id) throw new Error('Missing order id');

    window.location.href = '/preview/' + encodeURIComponent(data.id);
  } catch (err) {
    console.error(err);
    alert('Could not send bouquet right now. Please try again.');
  }
}`;

const bloomScript = bloomRawScript.replace(
  /function sendBouquet\(\) \{[\s\S]*?\n\}\n\nfunction resetForm\(\)/,
  `${sendBouquetOverride}\n\nfunction resetForm()`
);

export default function Home() {
  return (
    <BloomHomeClient
      bloomStyles={bloomStyles}
      bloomBody={bloomBody}
      bloomScript={bloomScript}
    />
  );
}
