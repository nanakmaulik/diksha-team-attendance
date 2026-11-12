import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { indiaDate, isTeamSlug } from "@/lib/sevaExpansion";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export async function GET(_request: NextRequest, ctx: Context) {
  const { slug } = await ctx.params;
  if (!isTeamSlug(slug)) return bad("Unknown department", 404);
  const { data: members, error } = await supabaseAdmin.from("seva_expansion_members")
    .select("id,name,location,is_leader,shifts:seva_expansion_shifts(id,start_time,end_time,sort_order)")
    .eq("department",slug).eq("active",true).order("sort_order");
  if (error) return bad("Could not load team",500);
  return NextResponse.json({ members, today: indiaDate() });
}
export async function POST(req: NextRequest, ctx: Context) {
  const { slug } = await ctx.params;
  if (!isTeamSlug(slug)) return bad("Unknown department",404);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return bad("Invalid JSON"); }
  const memberId = String(body.memberId || "");
  const shiftId = String(body.shiftId || "");
  const status = String(body.status || "");
  const reason = String(body.reason || "").trim().slice(0,1000);
  if (!memberId || !shiftId || !["PRESENT","LEAVE"].includes(status)) return bad("Select a member, shift and attendance status");
  if (status === "LEAVE" && !reason) return bad("Please provide leave reason");
  const { data: member } = await supabaseAdmin.from("seva_expansion_members").select("id").eq("id",memberId).eq("department",slug).eq("active",true).maybeSingle();
  if (!member) return bad("Member does not belong to this team");
  const { data: shift } = await supabaseAdmin.from("seva_expansion_shifts").select("id").eq("id",shiftId).eq("member_id",memberId).maybeSingle();
  if (!shift) return bad("Invalid shift for member");
  const date = indiaDate();
  const { error } = await supabaseAdmin.from("seva_expansion_attendance")
    .insert({ attendance_date:date, member_id:memberId, shift_id:shiftId, department:slug, status, leave_reason:status === "LEAVE" ? reason : null });
  if (error) {
    if (error.code === "23505") return bad("Attendance for this shift has already been submitted",409);
    return bad("Unable to save attendance",500);
  }
  return NextResponse.json({ ok:true, attendance_date:date });
}
