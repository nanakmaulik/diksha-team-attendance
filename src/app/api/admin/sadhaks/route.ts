import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Department = "Diksha" | "Parking";
type AttendanceGroup = "MALE" | "FEMALE";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function getDepartment(value: string | null): Department {
  return value === "Parking" ? "Parking" : "Diksha";
}

function getExpectedPin(department: Department) {
  if (department === "Parking") {
    return process.env.PARKING_ADMIN_PIN || "1111";
  }

  return process.env.ADMIN_PIN || "1175";
}

function isAuthorized(request: NextRequest, department: Department) {
  const pin = request.nextUrl.searchParams.get("pin") || "";
  return pin === getExpectedPin(department);
}

export async function GET(request: NextRequest) {
  const department = getDepartment(
    request.nextUrl.searchParams.get("department")
  );

  if (!isAuthorized(request, department)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("sadhaks")
    .select("id, name, mobile_number, attendance_group, department, active")
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

export async function POST(request: NextRequest) {
  const department = getDepartment(
    request.nextUrl.searchParams.get("department")
  );

  if (!isAuthorized(request, department)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const name = cleanText(body.name);
  const mobileNumber = cleanText(body.mobileNumber);
  const attendanceGroup: AttendanceGroup =
    body.attendanceGroup === "FEMALE" ? "FEMALE" : "MALE";

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Name required hai." },
      { status: 400 }
    );
  }

  const { data: latest } = await supabaseAdmin
    .from("sadhaks")
    .select("sort_order")
    .eq("department", department)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = Number(latest?.sort_order || 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("sadhaks")
    .upsert(
      {
        name,
        mobile_number: mobileNumber || null,
        active: true,
        department,
        attendance_group: attendanceGroup,
        sort_order: nextSortOrder,
      },
      {
        onConflict: "name",
      }
    )
    .select("id, name, mobile_number, attendance_group, department, active")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    sadhak: data,
  });
}

export async function DELETE(request: NextRequest) {
  const department = getDepartment(
    request.nextUrl.searchParams.get("department")
  );

  if (!isAuthorized(request, department)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const id = cleanText(request.nextUrl.searchParams.get("id"));

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Sadhak id required hai." },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("sadhaks")
    .select("id, department")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json(
      { ok: false, error: "Sadhak nahi mila." },
      { status: 404 }
    );
  }

  if (existing.department !== department) {
    return NextResponse.json(
      { ok: false, error: "Wrong department sadhak delete nahi kar sakte." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("sadhaks")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}