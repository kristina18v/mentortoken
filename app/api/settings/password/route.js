
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { protect } from "@/lib/auth";
import User from "@/models/User";

export async function PATCH(request) {
  try {
    const sessionUser = await protect(request);

    if (!sessionUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = await request.json();

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128 ||
      newPassword !== confirmPassword
    ) {
      return NextResponse.json(
        {
          message:
            "New password must be 8–128 characters and passwords must match.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(
      sessionUser._id
    ).select("+password");

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Password change is unavailable." },
        { status: 400 }
      );
    }

    const correct = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!correct) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 }
      );
    }

    if (
      await bcrypt.compare(newPassword, user.password)
    ) {
      return NextResponse.json(
        { message: "Choose a different password." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password:", error);
    return NextResponse.json(
      { message: "Failed to change password." },
      { status: 500 }
    );
  }
}
