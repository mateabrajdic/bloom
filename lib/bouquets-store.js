import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { kv } from "@vercel/kv";

const BOUQUET_KEY_PREFIX = "bouquet:";
const LEGACY_ORDER_KEY_PREFIX = "order:";
const BOUQUET_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCAL_STORE_DIR = process.env.VERCEL
  ? path.join("/tmp", "petalpost-data")
  : path.join(process.cwd(), ".data");
const LOCAL_STORE_FILE = path.join(LOCAL_STORE_DIR, "orders.json");
const SHORT_CODE_LENGTH = 8;

const BOUQUET_IDS = new Set(["classic", "tropical", "wildflowers"]);
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function normalizeBouquetId(value) {
  const bouquetId = String(value ?? "wildflowers").trim().toLowerCase();
  return BOUQUET_IDS.has(bouquetId) ? bouquetId : "wildflowers";
}

function normalizeColors(value) {
  let source = value;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return {};
    }
  }

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  const colors = {};
  for (const [key, colorValue] of Object.entries(source)) {
    const color = typeof colorValue === "string" ? colorValue.trim() : "";
    if (HEX_COLOR_RE.test(color) || color === "transparent") {
      colors[key] = color;
    }
  }

  return colors;
}

function normalizeStoredBouquet(record, fallbackId = "") {
  if (!record || typeof record !== "object") return null;

  const id = String(record.id ?? fallbackId ?? "").trim();
  if (!id) return null;

  const to = String(record.to ?? "").trim() || "Friend";

  return {
    id,
    preview_id:
      String(record.preview_id ?? buildPreviewId(to, id)).trim() || buildPreviewId(to, id),
    to,
    from: String(record.from ?? "").trim() || "Someone",
    message: String(record.message ?? "").trim(),
    bouquet_id: normalizeBouquetId(record.bouquet_id ?? record.bouquetId),
    colors: normalizeColors(record.colors),
    created_at: String(record.created_at ?? ""),
  };
}

export function normalizeBouquetInput(payload) {
  if (!payload || typeof payload !== "object") return null;

  const to = String(payload.to ?? "").trim();
  const from = String(payload.from ?? "").trim();
  if (!to || !from) return null;

  return {
    to,
    from,
    message: String(payload.message ?? "").trim(),
    bouquet_id: normalizeBouquetId(payload.bouquet_id ?? payload.bouquetId),
    colors: normalizeColors(payload.colors),
  };
}

async function ensureLocalStore() {
  await fs.mkdir(LOCAL_STORE_DIR, { recursive: true });

  try {
    await fs.access(LOCAL_STORE_FILE);
  } catch {
    await fs.writeFile(LOCAL_STORE_FILE, "{}\n", "utf8");
  }
}

async function readLocalStore() {
  await ensureLocalStore();
  const raw = await fs.readFile(LOCAL_STORE_FILE, "utf8");

  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

async function writeLocalStore(store) {
  await ensureLocalStore();
  await fs.writeFile(LOCAL_STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function buildBouquetKey(id) {
  return `${BOUQUET_KEY_PREFIX}${id}`;
}

function buildLegacyOrderKey(id) {
  return `${LEGACY_ORDER_KEY_PREFIX}${id}`;
}

async function getStoredBouquetValue(id) {
  const raw = await kv.get(buildBouquetKey(id));
  if (raw) return raw;

  return kv.get(buildLegacyOrderKey(id));
}

function slugifyReceiver(value) {
  const base = String(value ?? "")
    .replace(/[đĐ]/g, "d")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (base || "friend").slice(0, 24);
}

function buildPreviewId(to, id) {
  return `for-${slugifyReceiver(to)}-${id}`;
}

function extractBouquetId(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith("for-")) {
    const lastDash = raw.lastIndexOf("-");
    if (lastDash > 3 && lastDash < raw.length - 1) {
      return raw.slice(lastDash + 1);
    }
  }

  return raw;
}

async function bouquetExists(id) {
  if (!id) return false;

  if (isKvConfigured()) {
    const raw = await getStoredBouquetValue(id);
    return Boolean(raw);
  }

  const store = await readLocalStore();
  return Boolean(store[id]);
}

async function generateBouquetId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomBytes(6).toString("hex").slice(0, SHORT_CODE_LENGTH);
    if (!(await bouquetExists(id))) {
      return id;
    }
  }

  return crypto.randomUUID();
}

export async function createBouquet(payload) {
  const input = normalizeBouquetInput(payload);
  if (!input) {
    throw new Error("Invalid bouquet payload");
  }

  const id = await generateBouquetId();
  const bouquet = {
    id,
    preview_id: buildPreviewId(input.to, id),
    ...input,
    created_at: new Date().toISOString(),
  };

  if (isKvConfigured()) {
    await kv.set(buildBouquetKey(id), JSON.stringify(bouquet), { ex: BOUQUET_TTL_SECONDS });
    return bouquet;
  }

  const store = await readLocalStore();
  store[id] = bouquet;
  await writeLocalStore(store);
  return bouquet;
}

export async function getBouquetById(id) {
  const bouquetId = extractBouquetId(id);
  if (!bouquetId) return null;

  if (isKvConfigured()) {
    const raw = await getStoredBouquetValue(bouquetId);
    if (!raw) return null;

    if (typeof raw === "string") {
      try {
        return normalizeStoredBouquet(JSON.parse(raw), bouquetId);
      } catch {
        return null;
      }
    }

    return normalizeStoredBouquet(raw, bouquetId);
  }

  const store = await readLocalStore();
  return normalizeStoredBouquet(store[bouquetId], bouquetId);
}

export const normalizeOrderInput = normalizeBouquetInput;
export const createOrder = createBouquet;
export const getOrderById = getBouquetById;
