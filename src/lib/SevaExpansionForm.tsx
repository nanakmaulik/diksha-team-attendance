"use client";

import { useEffect, useMemo, useState } from "react";
import { timeLabel, type TeamSlug } from "@/lib/sevaExpansion";

type Shift = { id: string; start_time: string; end_time: string; sort_order: number };
type Member = { id: string; name: string; location: string; is_leader: boolean; shifts: Shift[] };

function LotusMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 52" fill="none" className={className} aria-hidden="true">
      <path d="M30 3C20 13 19 22 30 34C41 22 40 13 30 3Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M14 12C10 24 15 33 30 38C29 26 22 18 14 12ZM46 12C50 24 45 33 30 38C31 26 38 18 46 12Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M3 27C7 42 17 45 30 40C21 32 11 28 3 27ZM57 27C53 42 43 45 30 40C39 32 49 28 57 27Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M10 46H50" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return <svg className="pointer-events-none h-5 w-5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SevaExpansionForm({ slug, title }: { slug: TeamSlug; title: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState<"PRESENT" | "LEAVE">("PRESENT");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/seva/${slug}`, { cache: "no-store" })
      .then(async (r) => {
        const payload = await r.json();
        if (!r.ok || payload.error) throw Error(payload.error || "Could not load team");
        return payload;
      })
      .then((payload) => {
        if (!cancelled) { setMembers(payload.members || []); setNotice(""); }
      })
      .catch((error) => {
        if (!cancelled) { setNotice(error instanceof Error ? error.message : "Could not load team"); setNoticeKind("error"); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const member = useMemo(() => members.find((m) => m.id === memberId), [members, memberId]);
  const groups = Array.from(new Set(members.map((m) => m.location)));
  const shifts = useMemo(
    () => [...(member?.shifts || [])].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [member]
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberId || !shiftId || saving) return;
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch(`/api/seva/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, shiftId, status, reason }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Submission failed");
      setNotice(`${status === "LEAVE" ? "Leave" : "Attendance"} successfully recorded for today.`);
      setNoticeKind("success");
      setMemberId(""); setShiftId(""); setReason(""); setStatus("PRESENT");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setNoticeKind("error");
    } finally { setSaving(false); }
  }

  const selectClass = "w-full appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-4 pr-12 text-[15px] font-medium text-stone-900 shadow-[0_4px_18px_rgba(60,40,20,0.045)] outline-none transition-all duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf4] text-stone-900">
      {/* Decorative background only; never blocks form interactions. */}
      <div className="pointer-events-none absolute -left-36 top-28 h-80 w-80 rounded-full bg-orange-100/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 bottom-12 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#ffead6]/45 to-transparent" aria-hidden="true" />

      <header className="relative z-10 border-b border-[#eee3d8] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <LotusMark className="h-9 w-9 shrink-0 text-orange-600" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-stone-950 sm:text-lg">Seva Attendance</p>
              <p className="text-[11px] font-medium tracking-wide text-stone-500 sm:text-xs">Attendance Management</p>
            </div>
          </div>
          <span className="max-w-[48%] truncate rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-900 sm:px-4 sm:text-sm">{title}</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[760px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-[28px] border border-[#efe4d9] bg-white/95 shadow-[0_22px_70px_rgba(91,59,30,0.11)] sm:rounded-[32px]">
          <div className="relative overflow-hidden px-6 pb-7 pt-8 sm:px-10 sm:pb-9 sm:pt-10">
            <div className="pointer-events-none absolute -right-9 -top-8 text-orange-100/90" aria-hidden="true"><LotusMark className="h-44 w-44" /></div>
            <p className="relative mb-4 flex items-center gap-3 text-xl font-bold text-[#c84d09] sm:text-2xl"><span className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-600" />श्री हरिवंश</p>
            <h1 className="relative max-w-[560px] text-[27px] font-bold leading-[1.17] tracking-tight text-stone-950 sm:text-[38px]">{title}<span className="block">Attendance</span></h1>
            <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff5ea] px-3 py-2 text-xs font-medium text-[#8a5a36] sm:text-sm">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22s7-6 7-13a7 7 0 1 0-14 0c0 7 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/></svg>
              Shift-wise seva attendance · GPS setup pending
            </div>
          </div>

          <div className="border-t border-[#f4eee8] px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
            {loading ? (
              <div role="status" className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm font-medium text-orange-900">Loading team members…</div>
            ) : (
              <form onSubmit={submit} className="space-y-7">
                <div>
                  <label htmlFor="seva-member" className="mb-3 flex items-center gap-3 text-[15px] font-bold text-stone-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e0] text-[#b75b13]" aria-hidden="true">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M18 11a3 3 0 0 0 0-6M18 14a5 5 0 0 1 3 5v1" strokeLinecap="round"/></svg>
                    </span>
                    Sadhak / Sevadar
                  </label>
                  <div className="relative">
                    <select id="seva-member" required value={memberId} onChange={(event) => { setMemberId(event.target.value); setShiftId(""); }} className={selectClass}>
                      <option value="">Select a member</option>
                      {groups.map((group) => <optgroup key={group} label={group}>{members.filter((m) => m.location === group).map((m) => <option key={m.id} value={m.id}>{m.name}{m.is_leader ? " (Leader)" : ""}</option>)}</optgroup>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><Chevron /></div>
                  </div>
                </div>

                <div>
                  <label htmlFor="seva-shift" className="mb-3 flex items-center gap-3 text-[15px] font-bold text-stone-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e0] text-[#b75b13]" aria-hidden="true">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18" strokeLinecap="round"/></svg>
                    </span>
                    Assigned Shift
                  </label>
                  <div className="relative">
                    <select id="seva-shift" required disabled={!memberId || shifts.length === 0} value={shiftId} onChange={(event) => setShiftId(event.target.value)} className={selectClass}>
                      <option value="">{!memberId ? "Select a member first" : "Choose assigned shift"}</option>
                      {shifts.map((shift) => <option key={shift.id} value={shift.id}>{timeLabel(shift.start_time)} – {timeLabel(shift.end_time)}{shift.end_time <= shift.start_time ? " (next day)" : ""}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><Chevron /></div>
                  </div>
                  {member && shifts.length === 0 && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This member&apos;s shift timing is pending confirmation. Please contact the team admin.</p>}
                </div>

                <fieldset>
                  <legend className="mb-3 flex items-center gap-3 text-[15px] font-bold text-stone-900">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e0] text-[#b75b13]" aria-hidden="true">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    Mark Attendance
                  </legend>
                  <div className="grid grid-cols-2 gap-3 rounded-[20px] border border-stone-200 bg-stone-50/60 p-2 sm:gap-4">
                    <label className={`relative flex min-h-[66px] cursor-pointer items-center justify-center gap-2 rounded-[15px] border-2 px-3 py-4 text-[15px] font-bold transition-all sm:text-lg ${status === "PRESENT" ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm" : "border-transparent bg-white text-stone-700 hover:border-stone-200"}`}>
                      <input type="radio" name="seva-status" value="PRESENT" checked={status === "PRESENT"} onChange={() => setStatus("PRESENT")} className="peer sr-only" />
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${status === "PRESENT" ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300 bg-white text-transparent"}`}><CheckIcon className="h-4 w-4" /></span>
                      Present
                      <span className="pointer-events-none absolute inset-0 rounded-[13px] ring-orange-400 ring-offset-2 peer-focus-visible:ring-2" />
                    </label>
                    <label className={`relative flex min-h-[66px] cursor-pointer items-center justify-center gap-2 rounded-[15px] border-2 px-3 py-4 text-[15px] font-bold transition-all sm:text-lg ${status === "LEAVE" ? "border-orange-400 bg-orange-50 text-orange-900 shadow-sm" : "border-transparent bg-white text-stone-700 hover:border-stone-200"}`}>
                      <input type="radio" name="seva-status" value="LEAVE" checked={status === "LEAVE"} onChange={() => setStatus("LEAVE")} className="peer sr-only" />
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${status === "LEAVE" ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 bg-white text-transparent"}`}><CheckIcon className="h-4 w-4" /></span>
                      Leave
                      <span className="pointer-events-none absolute inset-0 rounded-[13px] ring-orange-400 ring-offset-2 peer-focus-visible:ring-2" />
                    </label>
                  </div>
                </fieldset>

                {status === "LEAVE" && (
                  <div>
                    <label htmlFor="seva-leave-reason" className="mb-2 block text-sm font-bold text-stone-800">Reason for leave</label>
                    <textarea id="seva-leave-reason" required maxLength={1000} rows={3} placeholder="Enter a brief reason" value={reason} onChange={(event) => setReason(event.target.value)} className="w-full resize-y rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                  </div>
                )}

                <button type="submit" disabled={saving || !shiftId} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ec7809] to-[#d34b05] px-5 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(202,83,12,0.20)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:text-lg">
                  {saving ? "Submitting…" : <><CheckIcon className="h-6 w-6" />Submit Attendance</>}
                </button>
              </form>
            )}
            {notice && <div role={noticeKind === "error" ? "alert" : "status"} className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${noticeKind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice}</div>}
            <a href={`/admin/seva/${slug}`} className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#c64f0b] transition-colors hover:text-orange-800 hover:underline">Admin Dashboard <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-stone-400">Seva attendance management</p>
      </section>
    </main>
  );
}
