import { createOrder } from "../../../lib/orders-store";

export const runtime = "nodejs";
const MAX_MESSAGE_LENGTH = 320;
const DEFAULT_WEBHOOK_APP = "flowernote";
const DEFAULT_WEBHOOK_FORM = "letter";
const DEFAULT_WEBHOOK_URL =
  "https://hook.eu1.make.com/drbybcn9sd9cox0fhbb09gwbca0w8qpz";

function normalizeWebhookValue(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");

  return normalized || fallback;
}

async function sendSubmissionWebhook({ request, order, submissionMeta }) {
  const webhookUrl = process.env.SUBMISSION_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const origin = new URL(request.url).origin;
  const payload = {
    event: "letter_submitted",
    app: submissionMeta.app,
    form: submissionMeta.form,
    submitted_at: order.created_at,
    order_id: order.id,
    preview_id: order.preview_id,
    preview_url: `${origin}/bouquet/${encodeURIComponent(order.preview_id)}`,
    to: order.to,
    from: order.from,
    message: order.message,
    message_length: order.message.length,
    bouquet_id: order.bouquet_id,
    colors: order.colors,
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Submission webhook failed", error);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const normalizedMessage = String(payload?.message || "").trim();
    const normalizedHoneypot = String(
      payload?.petalpost_confirm_code || payload?.website || ""
    ).trim();
    const submissionMeta = {
      app: normalizeWebhookValue(
        payload?.app,
        process.env.SUBMISSION_WEBHOOK_APP || DEFAULT_WEBHOOK_APP
      ),
      form: normalizeWebhookValue(
        payload?.form,
        process.env.SUBMISSION_WEBHOOK_FORM || DEFAULT_WEBHOOK_FORM
      ),
    };

    if (normalizedHoneypot) {
      return Response.json({ ok: true }, { status: 202 });
    }

    if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    const order = await createOrder(payload);
    await sendSubmissionWebhook({ request, order, submissionMeta });
    return Response.json({ id: order.preview_id, order }, { status: 201 });
  } catch (error) {
    console.error("Could not create order", error);
    return Response.json(
      { error: error?.message || "Could not create order" },
      { status: 400 }
    );
  }
}
