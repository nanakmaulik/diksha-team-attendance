"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Department = "Diksha" | "Parking";
type AttendanceGroup = "MALE" | "FEMALE";

type ManagedSadhak = {
  id: string;
  name: string;
  mobile_number: string | null;
  attendance_group: AttendanceGroup;
};

export default function ManageSadhaks({
  department,
  adminPin,
  showGroupSelect = false,
}: {
  department: Department;
  adminPin: string;
  showGroupSelect?: boolean;
}) {
  const router = useRouter();

  const [sadhaks, setSadhaks] = useState<ManagedSadhak[]>([]);
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [attendanceGroup, setAttendanceGroup] =
    useState<AttendanceGroup>("MALE");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSadhaks() {
    const response = await fetch(
      `/api/admin/sadhaks?pin=${encodeURIComponent(
        adminPin
      )}&department=${encodeURIComponent(department)}`
    );

    const result = await response.json();

    if (result.ok) {
      setSadhaks(result.sadhaks);
    }
  }

  useEffect(() => {
    loadSadhaks();
  }, [department, adminPin]);

  async function addSadhak(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Name required hai.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch(
      `/api/admin/sadhaks?pin=${encodeURIComponent(
        adminPin
      )}&department=${encodeURIComponent(department)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobileNumber,
          attendanceGroup,
        }),
      }
    );

    const result = await response.json();

    setLoading(false);

    if (!response.ok || !result.ok) {
      setMessage(result.error || "Name add nahi hua.");
      return;
    }

    setName("");
    setMobileNumber("");
    setAttendanceGroup("MALE");
    setMessage("Sadhak add ho gaya ✅");

    await loadSadhaks();
    router.refresh();
  }

  async function deleteSadhak(sadhak: ManagedSadhak) {
    const confirmed = window.confirm(
      `${sadhak.name} ko list se remove karna hai? Purani attendance safe rahegi.`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch(
      `/api/admin/sadhaks?pin=${encodeURIComponent(
        adminPin
      )}&department=${encodeURIComponent(department)}&id=${encodeURIComponent(
        sadhak.id
      )}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    setLoading(false);

    if (!response.ok || !result.ok) {
      setMessage(result.error || "Delete nahi hua.");
      return;
    }

    setMessage("Sadhak list se remove ho gaya ✅");

    await loadSadhaks();
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-zinc-900">
          Manage {department} Sadhaks
        </h2>
        <p className="text-sm text-zinc-500">
          Yahan se naam add/remove kar sakte ho. Delete karne par purani
          attendance safe rahegi.
        </p>
      </div>

      <form onSubmit={addSadhak} className="mt-5 grid gap-3 md:grid-cols-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Sadhak name"
          className="rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />

        <input
          value={mobileNumber}
          onChange={(event) => setMobileNumber(event.target.value)}
          placeholder="Mobile number optional"
          className="rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        />

        {showGroupSelect ? (
          <select
            value={attendanceGroup}
            onChange={(event) =>
              setAttendanceGroup(event.target.value as AttendanceGroup)
            }
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
          >
            <option value="MALE">Baba Log</option>
            <option value="FEMALE">Matayen</option>
          </select>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
            Parking Team
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Please wait..." : "Add Sadhak"}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
          {message}
        </div>
      )}

<div className="mt-5 max-h-[360px] overflow-auto rounded-2xl border border-zinc-200">
  <table className="min-w-full text-left text-sm">
    <thead className="sticky top-0 z-10 bg-zinc-100 text-zinc-700">
      <tr>
        <th className="px-4 py-3">Name</th>
        <th className="px-4 py-3">Mobile</th>
        {showGroupSelect && <th className="px-4 py-3">Group</th>}
        <th className="px-4 py-3">Action</th>
      </tr>
    </thead>

    <tbody>
      {sadhaks.map((sadhak) => (
        <tr key={sadhak.id} className="border-b last:border-b-0">
          <td className="px-4 py-2.5 font-semibold">{sadhak.name}</td>
          <td className="px-4 py-2.5">{sadhak.mobile_number || "-"}</td>

          {showGroupSelect && (
            <td className="px-4 py-2.5">
              {sadhak.attendance_group === "FEMALE"
                ? "Matayen"
                : "Baba Log"}
            </td>
          )}

          <td className="px-4 py-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => deleteSadhak(sadhak)}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}

      {sadhaks.length === 0 && (
        <tr>
          <td
            colSpan={showGroupSelect ? 4 : 3}
            className="px-4 py-8 text-center text-zinc-500"
          >
            Abhi koi active sadhak nahi hai.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
    </div>
  );
}