
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { protect } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Job from "@/models/Job";

export const runtime = "nodejs";

export async function DELETE(request) {
  try {
    const authUser = await protect(request);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (authUser.role !== "startup") {
      return NextResponse.json(
        {
          message:
            "Account deletion is currently available for startups only.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.password !== "string" ||
      !body.password ||
      body.confirmation !== "DELETE"
    ) {
      return NextResponse.json(
        {
          message:
            "Current password and DELETE confirmation are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(
      authUser._id
    ).select("+password");

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Account not found." },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(
      body.password,
      user.password
    );

    if (!validPassword) {
      return NextResponse.json(
        { message: "Incorrect password." },
        { status: 403 }
      );
    }

    // Keep jobs, but mark their startup as deleted.
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await Job.updateMany(
          { startupId: user._id },
          { $set: { startupDeleted: true } },
          { session }
        );

        const result = await User.deleteOne(
          { _id: user._id },
          { session }
        );

        if (result.deletedCount !== 1) {
          throw new Error("User deletion failed.");
        }
      });
    } finally {
      await session.endSession();
    }

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully.",
    });

    response.cookies.set("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to delete account.",
      },
      { status: 500 }
    );
  }
}
