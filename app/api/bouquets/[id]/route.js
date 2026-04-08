import { getBouquetById } from "../../../../lib/bouquets-store";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  const bouquet = await getBouquetById(id);
  if (!bouquet) {
    return Response.json({ error: "Bouquet not found" }, { status: 404 });
  }

  return Response.json(bouquet, { status: 200 });
}
