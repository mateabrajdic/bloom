import { createOrder } from "../../../lib/orders-store";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const order = await createOrder(payload);
    return Response.json({ id: order.id, order }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Could not create order" },
      { status: 400 }
    );
  }
}
