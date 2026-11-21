
import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";

const LANGUAGES = ["en", "mk"];
const DATE_FORMATS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
];

function getSettings(user) {
  const s = user.settings || {};

  return {
    profileVisible: s.profileVisible ?? true,
    showPhone: s.showPhone ?? false,
    availableForJobs: s.availableForJobs ?? true,
    jobInterests: s.jobInterests || [],
    language: s.language || "en",
    dateFormat: s.dateFormat || "DD/MM/YYYY",
    timezone: s.timezone || "Europe/Skopje",
  };
}

export async function GET(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: getSettings(user),
    });
  } catch (error) {
    console.error("GET settings:", error);
    return NextResponse.json(
      { message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      typeof body.profileVisible !== "boolean" ||
      typeof body.showPhone !== "boolean" ||
      typeof body.availableForJobs !== "boolean" ||
      !Array.isArray(body.jobInterests) ||
      body.jobInterests.length > 20 ||
      body.jobInterests.some(
        (value) =>
          typeof value !== "string" ||
          !value.trim() ||
          value.length > 60
      ) ||
      !LANGUAGES.includes(body.language) ||
      !DATE_FORMATS.includes(body.dateFormat) ||
      typeof body.timezone !== "string" ||
      body.timezone.length > 80
    ) {
      return NextResponse.json(
        { message: "Invalid settings" },
        { status: 400 }
      );
    }

    try {
      new Intl.DateTimeFormat("en", {
        timeZone: body.timezone,
      });
    } catch {
      return NextResponse.json(
        { message: "Invalid timezone" },
        { status: 400 }
      );
    }

    user.settings = {
      profileVisible: body.profileVisible,
      showPhone: body.showPhone,
      availableForJobs: body.availableForJobs,
      jobInterests: [
        ...new Set(
          body.jobInterests.map((value) => value.trim())
        ),
      ],
      language: body.language,
      dateFormat: body.dateFormat,
      timezone: body.timezone,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settings: getSettings(user),
    });
  } catch (error) {
    console.error("PATCH settings:", error);
    return NextResponse.json(
      { message: "Failed to save settings" },
      { status: 500 }
    );
  }
}
