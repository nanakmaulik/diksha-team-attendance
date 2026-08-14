import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDistanceMeters, getIndiaDateKey } from "@/lib/geo";

type AttendancePayload = {
  sadhakId?: string;
  sadhakName?: string;
  otherName?: string;
  sevaType?: "Morning Seva" | "Evening Seva";
  department?: string;
  attendanceType?: "PRESENT" | "LEAVE";
  leaveReason?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AttendancePayload;

    const sadhakId = cleanText(body.sadhakId);
    const selectedName = cleanText(body.sadhakName);
    const otherName = cleanText(body.otherName);
    const sevaType = cleanText(body.sevaType) as
      | "Morning Seva"
      | "Evening Seva";

    const department = cleanText(body.department) || "Diksha";
    const attendanceType =
      body.attendanceType === "LEAVE" ? "LEAVE" : "PRESENT";
    const leaveReason = cleanText(body.leaveReason);

    if (!sevaType || !["Morning Seva", "Evening Seva"].includes(sevaType)) {
      return NextResponse.json(
        { ok: false, error: "Please select Morning Seva or Evening Seva." },
        { status: 400 }
      );
    }

    let finalName = selectedName;

    if (selectedName === "Others") {
      if (!otherName) {
        return NextResponse.json(
          { ok: false, error: "Please write your name." },
          { status: 400 }
        );
      }

      finalName = otherName;
    }

    if (!finalName) {
      return NextResponse.json(
        { ok: false, error: "Please select your name." },
        { status: 400 }
      );
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    let accuracyMeters: number | null = null;
    let distanceFromCenterMeters: number | null = null;

    let locationStatus:
      | "VALID"
      | "OUTSIDE_LOCATION"
      | "LOW_ACCURACY"
      | "CENTER_NOT_CONFIGURED"
      | "LEAVE" = "CENTER_NOT_CONFIGURED";

    if (attendanceType === "LEAVE") {
      locationStatus = "LEAVE";
    } else {
      latitude = Number(body.latitude);
      longitude = Number(body.longitude);
      accuracyMeters =
        body.accuracyMeters === undefined
          ? null
          : Number(body.accuracyMeters);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json(
          { ok: false, error: "Location is required to mark attendance." },
          { status: 400 }
        );
      }

      const centerLat = Number(process.env.SEVA_CENTER_LAT);
      const centerLng = Number(process.env.SEVA_CENTER_LNG);
      const allowedRadiusMeters = Number(
        process.env.ALLOWED_RADIUS_METERS || 150
      );
      const maxAccuracyMeters = Number(process.env.MAX_ACCURACY_METERS || 150);

      if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
        distanceFromCenterMeters = Math.round(
          getDistanceMeters(centerLat, centerLng, latitude, longitude)
        );

        if (
          accuracyMeters !== null &&
          Number.isFinite(accuracyMeters) &&
          accuracyMeters > maxAccuracyMeters
        ) {
          locationStatus = "LOW_ACCURACY";
        } else if (distanceFromCenterMeters > allowedRadiusMeters) {
          locationStatus = "OUTSIDE_LOCATION";
        } else {
          locationStatus = "VALID";
        }
      }
    }

    const attendanceDate = getIndiaDateKey();
    const finalNameKey = normalizeKey(finalName);

    const { data, error } = await supabaseAdmin
      .from("seva_attendance")
      .insert({
        attendance_date: attendanceDate,
        sadhak_id: selectedName === "Others" ? null : sadhakId || null,
        sadhak_name: selectedName === "Others" ? null : selectedName,
        other_name: selectedName === "Others" ? otherName : null,
        final_name: finalName,
        final_name_key: finalNameKey,
        seva_type: sevaType,
        department,
        attendance_type: attendanceType,
        leave_reason: attendanceType === "LEAVE" ? leaveReason || null : null,
        latitude,
        longitude,
        accuracy_meters: accuracyMeters,
        distance_from_center_meters: distanceFromCenterMeters,
        location_status: locationStatus,
        device_info: request.headers.get("user-agent") || "",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Aaj is seva ke liye aapka response already submit ho chuka hai.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        attendanceType === "LEAVE"
          ? "Leave recorded successfully."
          : "Attendance recorded successfully.",
      record: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}