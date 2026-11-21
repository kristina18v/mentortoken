
import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";

export async function PATCH(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { avatar } = await request.json();

    if (
      typeof avatar !== "string" ||
      avatar.length > 220000 ||
      (avatar !== "" &&
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(
          avatar
        ))
    ) {
      return NextResponse.json(
        { message: "Invalid profile image" },
        { status: 400 }
      );
    }

    user.avatar = avatar;
    await user.save();

    return NextResponse.json({
      success: true,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("PATCH avatar:", error);

    return NextResponse.json(
      { message: "Failed to update image" },
      { status: 500 }
    );
  }
}
