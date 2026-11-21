
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { protect } from "@/lib/auth";
import User from "@/models/User";
import Job from "@/models/Job";

export async function GET(request, { params }) {
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
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid mentor ID" },
        { status: 400 }
      );
    }

    const mentor = await User.findOne({
      _id: id,
      role: "mentor",
    })
      .select("name surname email bio avatar createdAt phone skills photoUrl profileImage")
      .lean();

    if (!mentor) {
      return NextResponse.json(
        { message: "Mentor not found" },
        { status: 404 }
      );
    }

    const jobs = await Job.find({
      mentorId: id,
      startupId: user._id,
    })
      .select("title description category status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      mentor,
      jobs,
    });
  } catch (error) {
    console.error("GET mentor details:", error);
    return NextResponse.json(
      { message: "Failed to load mentor" },
      { status: 500 }
    );
  }
}
