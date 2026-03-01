import { createOrder } from "../../../lib/orders-store";

export const runtime = "nodejs";
const MAX_MESSAGE_LENGTH = 320;

export async function POST(request) {
  try {
    const payload = await request.json();
    const normalizedMessage = String(payload?.message || "").trim();
    if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    const order = await createOrder(payload);
    return Response.json({ id: order.id, order }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Could not create order" },
      { status: 400 }
    );
  }
}
