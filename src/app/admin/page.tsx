import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getIndiaDateKey } from "@/lib/geo";
import CopyWhatsAppSummary from "./CopyWhatsAppSummary";

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
  .select("name")
  .eq("active", true)
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true });

const activeNames = (sadhakData ?? []).map((sadhak) => sadhak.name);

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

const summaryMessage = buildSummaryMessage({
  selectedDate,
  rows,
  activeNames,
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
        </div>

        <CopyWhatsAppSummary message={summaryMessage} />

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

  function buildSummaryMessage({
    selectedDate,
    rows,
    activeNames,
  }: {
    selectedDate: string;
    activeNames: string[];
    rows: Array<{
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
  
    const isLeaveRow = (row: {
      attendance_type?: string;
      location_status: string;
    }) => row.attendance_type === "LEAVE" || row.location_status === "LEAVE";
  
    const formatTime = (dateValue: string) =>
      new Date(dateValue).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      });
  
    const getBreakdown = (sevaType: "Morning Seva" | "Evening Seva") => {
      const sevaRows = rows.filter((row) => row.seva_type === sevaType);
  
      const present = sevaRows
        .filter((row) => !isLeaveRow(row))
        .sort(
          (a, b) =>
            new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime()
        );
  
      const leave = sevaRows
        .filter((row) => isLeaveRow(row))
        .sort(
          (a, b) =>
            new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime()
        );
  
      const markedNames = new Set(
        sevaRows.map((row) => normalizeName(row.final_name))
      );
  
      const absent = activeNames.filter(
        (name) => !markedNames.has(normalizeName(name))
      );
  
      return {
        present,
        leave,
        absent,
      };
    };
  
    const makePresentLines = (
      records: Array<{ final_name: string; submitted_at: string }>
    ) => {
      if (records.length === 0) return ["No present attendance marked."];
  
      return records.map(
        (row, index) =>
          `${index + 1}. ${row.final_name} — ${formatTime(row.submitted_at)}`
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
  
    const morning = getBreakdown("Morning Seva");
    const evening = getBreakdown("Evening Seva");
  
    return [
      "🙏 श्री हरिवंश 🙏",
      "",
      "📋 *Diksha Team Attendance Summary*",
      `📅 Date: ${selectedDate}`,
      "",
      "🌅 *Morning Seva*",
      `✅ Present: ${morning.present.length}`,
      `🟡 Leave: ${morning.leave.length}`,
      `❌ Absent: ${morning.absent.length}`,
      "",
      "✅ *Morning Present List*",
      ...makePresentLines(morning.present),
      "",
      "🟡 *Morning Leave List*",
      ...makeLeaveLines(morning.leave),
      "",
      "❌ *Morning Absent List*",
      ...makeAbsentLines(morning.absent),
      "",
      "🌙 *Evening Seva*",
      `✅ Present: ${evening.present.length}`,
      `🟡 Leave: ${evening.leave.length}`,
      `❌ Absent: ${evening.absent.length}`,
      "",
      "✅ *Evening Present List*",
      ...makePresentLines(evening.present),
      "",
      "🟡 *Evening Leave List*",
      ...makeLeaveLines(evening.leave),
      "",
      "❌ *Evening Absent List*",
      ...makeAbsentLines(evening.absent),
    ].join("\n");
  }