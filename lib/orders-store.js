import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { kv } from "@vercel/kv";

const ORDER_KEY_PREFIX = "order:";
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCAL_STORE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORE_FILE = path.join(LOCAL_STORE_DIR, "orders.json");

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

function normalizeStoredOrder(record, fallbackId = "") {
  if (!record || typeof record !== "object") return null;

  const id = String(record.id ?? fallbackId ?? "").trim();
  if (!id) return null;

  return {
    id,
    to: String(record.to ?? "").trim() || "Friend",
    from: String(record.from ?? "").trim() || "Someone",
    message: String(record.message ?? "").trim(),
    bouquet_id: normalizeBouquetId(record.bouquet_id ?? record.bouquetId),
    colors: normalizeColors(record.colors),
    created_at: String(record.created_at ?? ""),
  };
}

export function normalizeOrderInput(payload) {
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

function buildOrderKey(id) {
  return `${ORDER_KEY_PREFIX}${id}`;
}

function generateOrderId() {
  return crypto.randomUUID();
}

export async function createOrder(payload) {
  const input = normalizeOrderInput(payload);
  if (!input) {
    throw new Error("Invalid order payload");
  }

  const id = generateOrderId();
  const order = {
    id,
    ...input,
    created_at: new Date().toISOString(),
  };

  if (isKvConfigured()) {
    await kv.set(buildOrderKey(id), JSON.stringify(order), { ex: ORDER_TTL_SECONDS });
    return order;
  }

  const store = await readLocalStore();
  store[id] = order;
  await writeLocalStore(store);
  return order;
}

export async function getOrderById(id) {
  const orderId = String(id ?? "").trim();
  if (!orderId) return null;

  if (isKvConfigured()) {
    const raw = await kv.get(buildOrderKey(orderId));
    if (!raw) return null;

    if (typeof raw === "string") {
      try {
        return normalizeStoredOrder(JSON.parse(raw), orderId);
      } catch {
        return null;
      }
    }

    return normalizeStoredOrder(raw, orderId);
  }

  const store = await readLocalStore();
  return normalizeStoredOrder(store[orderId], orderId);
}
