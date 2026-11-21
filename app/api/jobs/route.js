
import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import Job from "@/models/Job";


export async function GET(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "mine";

    let filter;

    if (scope === "mine") {
      if (user.role !== "startup") {
        return NextResponse.json(
          { message: "Only startups can view their jobs" },
          { status: 403 }
        );
      }

      filter = { startupId: user._id };
    } else if (scope === "open") {
      filter = {
  status: "open",
  startupDeleted: { $ne: true },
};
    } else {
      return NextResponse.json(
        { message: "Invalid jobs scope" },
        { status: 400 }
      );
    }

    const jobs = await Job.find(filter)
      .populate("startupId", "name surname avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error("GET jobs error:", error);

    return NextResponse.json(
      { message: "Failed to load jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "startup") {
      return NextResponse.json(
        { message: "Only startups can create jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "General";

    if (!title || !description) {
      return NextResponse.json(
        {
          message: "Title and description are required",
        },
        { status: 400 }
      );
    }

    const job = await Job.create({
      title,
      description,
      category: category || "General",
      startupId: user._id,
      status: "open",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job created successfully",
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST jobs error:", error);

    return NextResponse.json(
      { message: "Failed to create job" },
      { status: 500 }
    );
  }
}
