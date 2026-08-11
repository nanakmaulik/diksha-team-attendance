import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getIndiaDateKey } from "@/lib/geo";

type SearchParams = Promise<{ pin?: string }> | { pin?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const adminPin = process.env.ADMIN_PIN || "1234";

  if (params?.pin !== adminPin) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Admin Login</h1>
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

  const { data, error } = await supabaseAdmin
    .from("seva_attendance")
    .select("*")
    .eq("attendance_date", today)
    .order("submitted_at", { ascending: false });

  const rows = data ?? [];

  const morning = rows.filter((row) => row.seva_type === "Morning Seva");
  const evening = rows.filter((row) => row.seva_type === "Evening Seva");
  const valid = rows.filter((row) => row.location_status === "VALID");
  const outside = rows.filter(
    (row) => row.location_status === "OUTSIDE_LOCATION"
  );
  const lowAccuracy = rows.filter(
    (row) => row.location_status === "LOW_ACCURACY"
  );

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-orange-700 font-semibold">श्री हरिवंश</p>
          <h1 className="mt-1 text-3xl font-bold">
            Diksha Team Attendance Admin
          </h1>
          <p className="mt-2 text-sm text-zinc-600">Date: {today}</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <Stat label="Total" value={rows.length} />
            <Stat label="Morning" value={morning.length} />
            <Stat label="Evening" value={evening.length} />
            <Stat label="Valid" value={valid.length} />
            <Stat
              label="Review"
              value={outside.length + lowAccuracy.length}
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Seva</th>
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
                    colSpan={7}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    Aaj abhi koi attendance nahi hai.
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
    <div className="rounded-2xl bg-orange-50 p-4">
      <p className="text-sm font-medium text-orange-800">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
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
      : "No Center";

  const className =
    status === "VALID"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}