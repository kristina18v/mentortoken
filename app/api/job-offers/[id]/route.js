
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { protect } from "@/lib/auth";
import JobOffer from "@/models/JobOffer";

export async function PATCH(request, { params }) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid offer ID" },
        { status: 400 }
      );
    }

    const { status } = await request.json();

    let filter = { _id: id, status: "pending" };

    if (user.role === "startup" && status === "canceled") {
      filter.startupId = user._id;
    } else if (
      user.role === "mentor" &&
      ["accepted", "rejected"].includes(status)
    ) {
      filter.mentorId = user._id;
    } else {
      return NextResponse.json(
        { message: "Action not allowed" },
        { status: 403 }
      );
    }

    const offer = await JobOffer.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return NextResponse.json(
        { message: "Pending offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error("PATCH job offer:", error);
    return NextResponse.json(
      { message: "Failed to update offer" },
      { status: 500 }
    );
  }
}
