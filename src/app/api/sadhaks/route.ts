import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const department =
    request.nextUrl.searchParams.get("department") || "Diksha";

  const { data, error } = await supabaseAdmin
    .from("sadhaks")
    .select("id, name")
    .eq("active", true)
    .eq("department", department)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    sadhaks: data ?? [],
  });
}