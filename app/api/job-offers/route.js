
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { protect } from "@/lib/auth";
import JobOffer from "@/models/JobOffer";
import User from "@/models/User";

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
    const mentorId = searchParams.get("mentorId");

    const filter =
      user.role === "startup"
        ? { startupId: user._id }
        : { mentorId: user._id };

    if (mentorId && user.role === "startup") {
      if (!mongoose.isValidObjectId(mentorId)) {
        return NextResponse.json(
          { message: "Invalid mentor ID" },
          { status: 400 }
        );
      }

      filter.mentorId = mentorId;
    }

    const offers = await JobOffer.find(filter)
      .populate("mentorId", "name surname avatar")
      .populate("startupId", "name surname avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("GET job offers:", error);
    return NextResponse.json(
      { message: "Failed to load offers" },
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
        { message: "Only startups can send offers" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const mentorId = body.mentorId;
    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (
      !mongoose.isValidObjectId(mentorId) ||
      !title ||
      !description ||
      title.length > 120 ||
      description.length > 2000
    ) {
      return NextResponse.json(
        { message: "Invalid offer details" },
        { status: 400 }
      );
    }

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
    });

    if (!mentor) {
      return NextResponse.json(
        { message: "Mentor not found" },
        { status: 404 }
      );
    }

    const offer = await JobOffer.create({
      startupId: user._id,
      mentorId: mentor._id,
      title,
      description,
    });

    return NextResponse.json(
      { success: true, offer },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST job offer:", error);
    return NextResponse.json(
      { message: "Failed to send offer" },
      { status: 500 }
    );
  }
}
