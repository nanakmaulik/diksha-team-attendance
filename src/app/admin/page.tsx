import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getIndiaDateKey } from "@/lib/geo";
import CopyWhatsAppSummary from "./CopyWhatsAppSummary";
import ManageSadhaks from "./ManageSadhaks";

type AdminSearchParams =
  | Promise<{
      pin?: string;
      date?: string;
      seva?: string;
      status?: string;
      view?: string;
    }>
  | {
      pin?: string;
      date?: string;
      seva?: string;
      status?: string;
      view?: string;
    };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await Promise.resolve(searchParams);

  const adminPin = process.env.ADMIN_PIN || "1175";

  if (params?.pin !== adminPin) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow">
          <p className="font-semibold text-orange-700">श्री हरिवंश</p>
          <h1 className="mt-2 text-2xl font-bold">Admin Login</h1>

          <form className="mt-6 space-y-4">
            <input
              name="pin"
              type="password"
              placeholder="Enter admin PIN"
              className="w-full rounded-xl border px-4 py-3"
            />

            <button className="w-full rounded-xl bg-orange-700 px-4 py-3 font-bold text-white">
              Open Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  const today = getIndiaDateKey();
  const selectedDate = params?.date || today;
  const selectedSeva = params?.seva || "ALL";
  const selectedStatus = params?.status || "ALL";
  const viewMode = params?.view || "TODAY";

  let query = supabaseAdmin
  .from("seva_attendance")
  .select("*")
  .eq("department", "Diksha")
  .order("submitted_at", { ascending: false });

  if (viewMode !== "ALL") {
    query = query.eq("attendance_date", selectedDate);
  }

  if (selectedSeva !== "ALL") {
    query = query.eq("seva_type", selectedSeva);
  }

  if (selectedStatus !== "ALL") {
    query = query.eq("location_status", selectedStatus);
  }

  const { data, error } = await query;

  const rows = data ?? [];
  const { data: sadhakData } = await supabaseAdmin
  .from("sadhaks")
  .select("id, name, attendance_group")
  .eq("active", true)
  .eq("department", "Diksha")
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true });

const activeSadhaks = (sadhakData ?? []).map((sadhak) => ({
  id: sadhak.id as string,
  name: sadhak.name as string,
  attendance_group: (sadhak.attendance_group || "MALE") as "MALE" | "FEMALE",
}));

const isLeaveRow = (row: { attendance_type?: string; location_status: string }) =>
  row.attendance_type === "LEAVE" || row.location_status === "LEAVE";

const presentRows = rows.filter((row) => !isLeaveRow(row));
const leaveRows = rows.filter((row) => isLeaveRow(row));

const morning = presentRows.filter((row) => row.seva_type === "Morning Seva");
const evening = presentRows.filter((row) => row.seva_type === "Evening Seva");
const valid = presentRows.filter((row) => row.location_status === "VALID");
const outside = presentRows.filter(
  (row) => row.location_status === "OUTSIDE_LOCATION"
);
const lowAccuracy = presentRows.filter(
  (row) => row.location_status === "LOW_ACCURACY"
);

const babaSummaryMessage = buildGroupSummaryMessage({
  selectedDate,
  rows,
  activeSadhaks,
  group: "MALE",
  title: "Baba Log Attendance Summary",
});

const mataSummaryMessage = buildGroupSummaryMessage({
  selectedDate,
  rows,
  activeSadhaks,
  group: "FEMALE",
  title: "Matayen Attendance Summary",
});

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="font-semibold text-orange-700">श्री हरिवंश</p>

          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">
  Diksha Team Attendance Admin
</h1>
              <p className="mt-2 text-sm text-zinc-600">
                {viewMode === "ALL"
                  ? "Showing all attendance records"
                  : `Showing records for ${selectedDate}`}
              </p>
            </div>

            <a
              href={`/?adminBack=${adminPin}`}
              className="rounded-xl bg-orange-100 px-4 py-3 text-sm font-bold text-orange-800"
            >
              Open Attendance Form
            </a>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
              {error.message}
            </div>
          )}

          <form className="mt-6 grid gap-4 rounded-2xl bg-zinc-50 p-4 md:grid-cols-5">
            <input type="hidden" name="pin" value={adminPin} />

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">View</span>
              <select
                name="view"
                defaultValue={viewMode}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
              >
                <option value="TODAY">Selected Date</option>
                <option value="ALL">All Records</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Date</span>
              <input
                name="date"
                type="date"
                defaultValue={selectedDate}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Seva</span>
              <select
                name="seva"
                defaultValue={selectedSeva}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
              >
                <option value="ALL">All</option>
                <option value="Morning Seva">Morning Seva</option>
                <option value="Evening Seva">Evening Seva</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Status</span>
              <select
                name="status"
                defaultValue={selectedStatus}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
              >
                <option value="ALL">All</option>
                <option value="VALID">Valid</option>
                <option value="OUTSIDE_LOCATION">Outside Location</option>
                <option value="LOW_ACCURACY">Low Accuracy</option>
                <option value="CENTER_NOT_CONFIGURED">No Center</option>
              </select>
            </label>

            <button className="rounded-xl bg-orange-700 px-4 py-2 font-bold text-white md:mt-5">
              Apply Filter
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-7">
  <Stat label="Total" value={rows.length} />
  <Stat label="Present" value={presentRows.length} />
  <Stat label="Leave" value={leaveRows.length} />
  <Stat label="Morning" value={morning.length} />
  <Stat label="Evening" value={evening.length} />
  <Stat label="Outside" value={outside.length} />
  <Stat label="Low Accuracy" value={lowAccuracy.length} />
</div>
<ManageSadhaks
  department="Diksha"
  adminPin={adminPin}
  showGroupSelect={true}
/>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
  <CopyWhatsAppSummary
    title="Baba Log WhatsApp Message"
    message={babaSummaryMessage}
  />

  <CopyWhatsAppSummary
    title="Matayen WhatsApp Message"
    message={mataSummaryMessage}
  />
</div>

        <div className="mt-6 overflow-x-auto rounded-3xl bg-white text-zinc-900 shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Seva</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Map</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const mapUrl = `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;

                return (
                  <tr key={row.id} className="border-b">
                    <td className="px-4 py-3">{row.attendance_date}</td>

                    <td className="px-4 py-3">
                      {new Date(row.submitted_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {row.final_name}
                    </td>

                    <td className="px-4 py-3">{row.seva_type}</td>

                    <td className="px-4 py-3">{row.department}</td>

                    <td className="px-4 py-3">
                      <StatusBadge status={row.location_status} />
                    </td>

                    <td className="px-4 py-3">
                      {row.distance_from_center_meters === null
                        ? "-"
                        : `${Math.round(
                            row.distance_from_center_meters
                          )} m`}
                    </td>

                    <td className="px-4 py-3">
                      {row.accuracy_meters === null
                        ? "-"
                        : `${Math.round(row.accuracy_meters)} m`}
                    </td>

                    <td className="px-4 py-3">
                      <a
                        href={mapUrl}
                        target="_blank"
                        className="font-semibold text-orange-700 underline"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    Is filter ke according abhi koi attendance nahi hai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
        <p className="text-sm font-bold text-orange-800">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-zinc-900">{value}</p>
      </div>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const label =
      status === "VALID"
        ? "Valid"
        : status === "OUTSIDE_LOCATION"
          ? "Outside"
          : status === "LOW_ACCURACY"
            ? "Low Accuracy"
            : status === "LEAVE"
              ? "Leave"
              : "No Center";
  
    const className =
      status === "VALID"
        ? "bg-green-100 text-green-800"
        : status === "OUTSIDE_LOCATION"
          ? "bg-red-100 text-red-800"
          : status === "LEAVE"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-orange-100 text-orange-800";
  
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
        {label}
      </span>
    );
  }

  function buildGroupSummaryMessage({
    selectedDate,
    rows,
    activeSadhaks,
    group,
    title,
  }: {
    selectedDate: string;
    group: "MALE" | "FEMALE";
    title: string;
    activeSadhaks: Array<{
      id: string;
      name: string;
      attendance_group: "MALE" | "FEMALE";
    }>;
    rows: Array<{
      sadhak_id?: string | null;
      final_name: string;
      seva_type: string;
      submitted_at: string;
      location_status: string;
      attendance_type?: string;
      leave_reason?: string | null;
    }>;
  }) {
    const normalizeName = (name: string) =>
      name.trim().toLowerCase().replace(/\s+/g, " ");
  
    const activeGroupSadhaks = activeSadhaks.filter(
      (sadhak) => sadhak.attendance_group === group
    );
  
    const activeNameToGroup = new Map(
      activeSadhaks.map((sadhak) => [
        normalizeName(sadhak.name),
        sadhak.attendance_group,
      ])
    );
  
    const activeIdToGroup = new Map(
      activeSadhaks.map((sadhak) => [sadhak.id, sadhak.attendance_group])
    );
  
    const isLeaveRow = (row: {
      attendance_type?: string;
      location_status: string;
    }) => row.attendance_type === "LEAVE" || row.location_status === "LEAVE";
  
    const getRowGroup = (row: {
      sadhak_id?: string | null;
      final_name: string;
    }) => {
      if (row.sadhak_id && activeIdToGroup.has(row.sadhak_id)) {
        return activeIdToGroup.get(row.sadhak_id);
      }
  
      return activeNameToGroup.get(normalizeName(row.final_name)) || "MALE";
    };
  
    const formatTime = (dateValue: string) =>
      new Date(dateValue).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      });
  
    const statusIcon = (status: string) => {
      if (status === "VALID") return "✅";
      if (status === "OUTSIDE_LOCATION") return "⚠️";
      if (status === "LOW_ACCURACY") return "📍";
      return "ℹ️";
    };
  
    const morningRows = rows.filter(
      (row) => row.seva_type === "Morning Seva" && getRowGroup(row) === group
    );
  
    const present = morningRows
      .filter((row) => !isLeaveRow(row))
      .sort(
        (a, b) =>
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
      );
  
    const leave = morningRows
      .filter((row) => isLeaveRow(row))
      .sort(
        (a, b) =>
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
      );
  
    const markedNames = new Set(
      morningRows.map((row) => normalizeName(row.final_name))
    );
  
    const absent = activeGroupSadhaks
      .map((sadhak) => sadhak.name)
      .filter((name) => !markedNames.has(normalizeName(name)));
  
    const makePresentLines = (
      records: Array<{
        final_name: string;
        submitted_at: string;
        location_status: string;
      }>
    ) => {
      if (records.length === 0) return ["No present attendance marked."];
  
      return records.map(
        (row, index) =>
          `${index + 1}. ${row.final_name} — ${formatTime(
            row.submitted_at
          )} ${statusIcon(row.location_status)}`
      );
    };
  
    const makeLeaveLines = (
      records: Array<{
        final_name: string;
        submitted_at: string;
        leave_reason?: string | null;
      }>
    ) => {
      if (records.length === 0) return ["No leave marked."];
  
      return records.map((row, index) => {
        const reason = row.leave_reason ? ` — ${row.leave_reason}` : "";
        return `${index + 1}. ${row.final_name} — ${formatTime(
          row.submitted_at
        )}${reason}`;
      });
    };
  
    const makeAbsentLines = (names: string[]) => {
      if (names.length === 0) return ["No absent sadhaks."];
  
      return names.map((name, index) => `${index + 1}. ${name}`);
    };
  
    return [
      "🙏 श्री हरिवंश 🙏",
      "",
      `📋 *${title}*`,
      `📅 Date: ${selectedDate}`,
      "",
      "🌅 *Morning Seva*",
      `✅ Present: ${present.length}`,
      `🟡 Leave: ${leave.length}`,
      `❌ Absent: ${absent.length}`,
      "",
      "✅ *Present List*",
      ...makePresentLines(present),
      "",
      "🟡 *Leave List*",
      ...makeLeaveLines(leave),
      "",
      "❌ *Absent List*",
      ...makeAbsentLines(absent),
      "",
      "✅ = Valid | ⚠️ = Outside | 📍 = Low GPS Accuracy",
    ].join("\n");
  }