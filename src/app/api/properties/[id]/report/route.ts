import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { evaluateBuildability } from "@/lib/evaluateBuildability";

export const revalidate = 60; // cache hint

type Row = {
  id: string;
  address: string;
  lot_frontage_m: number | null;
  lot_depth_m: number | null;
  zoning_code: string | null;
  zoning_description: string | null;
  in_flood: boolean;
  lot_area_m2: number | null;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const pool = getPool();
  const sql = `
    WITH p AS (
      SELECT id, address, lot_frontage_m, lot_depth_m, geom,
             CASE WHEN lot_frontage_m IS NOT NULL AND lot_depth_m IS NOT NULL
                  THEN lot_frontage_m * lot_depth_m
                  ELSE NULL END AS lot_area_m2
      FROM parcels WHERE id = $1
    ),
    z AS (
      SELECT z.code AS zoning_code, z.description AS zoning_description
      FROM zoning_areas z, p WHERE ST_Contains(z.geom, p.geom) LIMIT 1
    ),
    f AS (
      SELECT EXISTS (SELECT 1 FROM flood_zones fz, p WHERE ST_Intersects(fz.geom, p.geom)) AS in_flood
    )
    SELECT p.id, p.address, p.lot_frontage_m, p.lot_depth_m, p.lot_area_m2,
           z.zoning_code, z.zoning_description, f.in_flood
    FROM p LEFT JOIN z ON true LEFT JOIN f ON true;
  `;
  const { rows } = await pool.query<Row>(sql, [id]);

  if (rows.length === 0) return NextResponse.json({ error: "Parcel not found" }, { status: 404 });

  const r = rows[0];
  const buildability = evaluateBuildability({
    zoningCode: r.zoning_code,
    frontageM: r.lot_frontage_m,
    flood: r.in_flood,
  });

  return NextResponse.json({
    id: r.id,
    address: r.address,
    zoning: { code: r.zoning_code, description: r.zoning_description },
    metrics: { frontage_m: r.lot_frontage_m, depth_m: r.lot_depth_m, lotArea_m2: r.lot_area_m2 },
    riskFlags: r.in_flood ? ["flood"] : [],
    buildability,
    generatedAt: new Date().toISOString(),
  }, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" }
  });
}