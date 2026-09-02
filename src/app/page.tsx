"use client";

import { useEffect, useState } from "react";


type Sadhak = {
  id: string;
  name: string;
};

type SubmitStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
  details?: string;
};

export default function AttendancePage() {
  const [sadhaks, setSadhaks] = useState<Sadhak[]>([]);
  const [sadhakId, setSadhakId] = useState("");
  const [sadhakName, setSadhakName] = useState("");
  const [otherName, setOtherName] = useState("");
  const [sevaType, setSevaType] = useState("");
  const [department, setDepartment] = useState("Diksha");
  const [attendanceType, setAttendanceType] = useState<"PRESENT" | "LEAVE">(
    "PRESENT"
  );
  const [leaveReason, setLeaveReason] = useState("");
  const [status, setStatus] = useState<SubmitStatus>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    async function loadSadhaks() {
      setSadhaks([]);
      setSadhakId("");
      setSadhakName("");
      setOtherName("");
  
      const response = await fetch(
        `/api/sadhaks?department=${encodeURIComponent(department)}`
      );
      const result = await response.json();
  
      if (result.ok) {
        setSadhaks(result.sadhaks);
      }
    }
  
    loadSadhaks();
  }, [department]);

  function handleNameChange(value: string) {
    setSadhakName(value);

    const selected = sadhaks.find((sadhak) => sadhak.name === value);
    setSadhakId(selected?.id || "");
  }

  async function submitAttendance() {
    if (!sadhakName) {
      setStatus({
        type: "error",
        message: "Kripya apna naam select karein.",
      });
      return;
    }
  
    if (sadhakName === "Others" && !otherName.trim()) {
      setStatus({
        type: "error",
        message: "Others select kiya hai, kripya apna naam likhein.",
      });
      return;
    }
  
    if (!sevaType) {
      setStatus({
        type: "error",
        message: "Kripya Morning Seva ya Evening Seva select karein.",
      });
      return;
    }
  
    if (attendanceType === "LEAVE") {
      setStatus({
        type: "loading",
        message: "Leave save ho rahi hai...",
      });
  
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sadhakId,
          sadhakName,
          otherName,
          sevaType,
          department,
          attendanceType: "LEAVE",
          leaveReason,
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok || !result.ok) {
        setStatus({
          type: "error",
          message: result.error || "Leave save nahi hui.",
        });
        return;
      }
  
      setStatus({
        type: "success",
        message: "Radhe Radhe 🙏 Aapki leave record ho gayi hai.",
      });
  
      return;
    }
  
    setStatus({
      type: "loading",
      message: "Location permission maang rahe hain...",
    });
  
    if (!navigator.geolocation) {
      setStatus({
        type: "error",
        message: "Is device/browser me location support nahi hai.",
      });
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus({
          type: "loading",
          message: "Attendance save ho rahi hai...",
        });
  
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sadhakId,
            sadhakName,
            otherName,
            sevaType,
            department,
            attendanceType: "PRESENT",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          }),
        });
  
        const result = await response.json();
  
        if (!response.ok || !result.ok) {
          setStatus({
            type: "error",
            message: result.error || "Attendance save nahi hui.",
          });
          return;
        }
  
        setStatus({
          type: "success",
          message: "Radhe Radhe 🙏 Aapki attendance record ho gayi hai.",
        });
      },
      () => {
        setStatus({
          type: "error",
          message:
            "Location permission required hai. Location allow kiye bina attendance mark nahi hogi.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex justify-end">
      <div className="mb-5 flex justify-end">
  <a
    href="/admin"
    className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700"
  >
    Admin Dashboard
  </a>
</div>
</div>
        <div className="text-center">
          <p className="text-lg font-semibold text-orange-700">श्री हरिवंश</p>
          <h1 className="mt-2 text-3xl font-bold">Diksha Team Attendance</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Attendance mark karne ke liye location permission allow karna
            zaroori hai.
          </p>
        </div>

        <div className="mt-8 space-y-5">

        <label className="block">
            <span className="text-sm font-semibold">Department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
            >
           <option value="Diksha">Diksha</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Sadhak Name</span>
            <select
              value={sadhakName}
              onChange={(event) => handleNameChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
            >
              <option value="">Choose</option>
              {sadhaks.map((sadhak) => (
                <option key={sadhak.id} value={sadhak.name}>
                  {sadhak.name}
                </option>
              ))}
              <option value="Others">Others</option>
            </select>
          </label>

          {sadhakName === "Others" && (
            <label className="block">
              <span className="text-sm font-semibold">
                If Others, write name
              </span>
              <input
                value={otherName}
                onChange={(event) => setOtherName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3"
                placeholder="Apna naam likhein"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-semibold">Seva</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {["Morning Seva", "Evening Seva"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSevaType(value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    sevaType === value
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-800"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
  <span className="text-sm font-semibold">Response Type</span>

  <div className="mt-2 grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setAttendanceType("PRESENT")}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        attendanceType === "PRESENT"
          ? "border-green-700 bg-green-700 text-white"
          : "border-zinc-300 bg-white text-zinc-800"
      }`}
    >
      Mark Present
    </button>

    <button
      type="button"
      onClick={() => setAttendanceType("LEAVE")}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        attendanceType === "LEAVE"
          ? "border-yellow-600 bg-yellow-500 text-white"
          : "border-zinc-300 bg-white text-zinc-800"
      }`}
    >
      Mark Leave
    </button>
  </div>
</label>

{attendanceType === "LEAVE" && (
  <label className="block">
    <span className="text-sm font-semibold">Leave Reason</span>
    <textarea
      value={leaveReason}
      onChange={(event) => setLeaveReason(event.target.value)}
      className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3"
      placeholder="Permission / leave reason likhein"
      rows={3}
    />
  </label>
)}


          <button
            onClick={submitAttendance}
            disabled={status.type === "loading"}
            className="w-full rounded-2xl bg-orange-700 px-5 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-60"
          >
            {status.type === "loading"
  ? "Please wait..."
  : attendanceType === "LEAVE"
    ? "Submit Leave"
    : "Mark Present"}
          </button>

          {status.message && (
            <div
              className={`whitespace-pre-line rounded-2xl p-4 text-sm font-medium ${
                status.type === "success"
                  ? "bg-green-50 text-green-800"
                  : status.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              <p>{status.message}</p>
              {status.details && <p className="mt-2">{status.details}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}