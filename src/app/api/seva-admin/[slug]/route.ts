import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { indiaDate, isTeamSlug, validPin } from "@/lib/sevaExpansion";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
async function authorized(req: NextRequest, ctx: Context) {
  const { slug } = await ctx.params;
  if (!isTeamSlug(slug)) return null;
  if (!validPin(slug, req.headers.get("x-seva-pin"))) return null;
  return slug;
}
export async function GET(req: NextRequest, ctx: Context) {
  const slug=await authorized(req,ctx); if (!slug) return bad("Invalid admin PIN",401);
  const date=req.nextUrl.searchParams.get("date") || indiaDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("Invalid date");
  const [m,a]=await Promise.all([
    supabaseAdmin.from("seva_expansion_members").select("id,name,location,is_leader,active,shifts:seva_expansion_shifts(id,start_time,end_time,sort_order)").eq("department",slug).order("sort_order"),
    supabaseAdmin.from("seva_expansion_attendance").select("id,member_id,shift_id,status,leave_reason,submitted_at").eq("department",slug).eq("attendance_date",date)
  ]);
  if (m.error || a.error) return bad("Dashboard unavailable",500);
  return NextResponse.json({ date, members:m.data, attendance:a.data });
}
export async function POST(req: NextRequest, ctx: Context) {
  const slug=await authorized(req,ctx); if (!slug) return bad("Invalid admin PIN",401);
  const body=await req.json().catch(()=>null); if (!body) return bad("Invalid JSON");
  if (body.action === "add-member") {
    const name=String(body.name||"").trim().slice(0,120);
    const location=String(body.location||"General").trim().slice(0,100);
    if (!name) return bad("Name required");
    const {data,error}=await supabaseAdmin.from("seva_expansion_members")
      .insert({department:slug,name,location,is_leader:!!body.isLeader,active:true,sort_order:9999}).select("id").single();
    if (error) return bad(error.code==="23505" ? "Member already exists in this location" : "Could not add member",400);
    return NextResponse.json({ok:true,id:data.id});
  }
  if (body.action === "set-active") {
    const {error}=await supabaseAdmin.from("seva_expansion_members").update({active:body.active===true})
      .eq("department",slug).eq("id",String(body.memberId||""));
    if (error) return bad("Unable to update member",500);
    return NextResponse.json({ok:true});
  }
  if (body.action === "add-shift") {
    const memberId=String(body.memberId||"");
    const start=String(body.start||""); const end=String(body.end||"");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)|| !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start===end) return bad("Valid start/end times required");
    const {data:member}=await supabaseAdmin.from("seva_expansion_members").select("id").eq("department",slug).eq("id",memberId).maybeSingle();
    if (!member) return bad("Member not found");
    const {error}=await supabaseAdmin.from("seva_expansion_shifts").insert({member_id:memberId,start_time:start,end_time:end,sort_order:9999});
    if (error) return bad("Unable to add shift",500);
    return NextResponse.json({ok:true});
  }
  if (body.action === "remove-shift") {
    const memberId=String(body.memberId||""); const shiftId=String(body.shiftId||"");
    const {data:member}=await supabaseAdmin.from("seva_expansion_members").select("id").eq("department",slug).eq("id",memberId).maybeSingle();
    if (!member) return bad("Member not found");
    const {data:records}=await supabaseAdmin.from("seva_expansion_attendance").select("id").eq("shift_id",shiftId).limit(1);
    if (records?.length) return bad("Shift has attendance history; cannot delete",409);
    const {error}=await supabaseAdmin.from("seva_expansion_shifts").delete().eq("id",shiftId).eq("member_id",memberId);
    if (error) return bad("Unable to delete shift",500);
    return NextResponse.json({ok:true});
  }
  return bad("Unknown action");
}
