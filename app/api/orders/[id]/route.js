import { getOrderById } from "../../../../lib/orders-store";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  const order = await getOrderById(id);
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order, { status: 200 });
}
