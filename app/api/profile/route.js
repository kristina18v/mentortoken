
import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";

function publicProfile(user) {
  return {
    _id: String(user._id),
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    bio: user.bio || "",
    phone: user.phone || "",
    skills: user.skills || [],
    createdAt: user.createdAt,
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
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("GET profile:", error);

    return NextResponse.json(
      { message: "Failed to load profile" },
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

    const name = body.name;
    const surname = body.surname;
    const bio = body.bio;
    const phone = body.phone;
    const skills = body.skills;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 80 ||
      typeof surname !== "string" ||
      !surname.trim() ||
      surname.trim().length > 80 ||
      typeof bio !== "string" ||
      bio.length > 1000 ||
      typeof phone !== "string" ||
      phone.length > 30 ||
      !Array.isArray(skills) ||
      skills.length > 20 ||
      skills.some(
        (skill) =>
          typeof skill !== "string" ||
          !skill.trim() ||
          skill.length > 50
      )
    ) {
      return NextResponse.json(
        { message: "Invalid profile information" },
        { status: 400 }
      );
    }

    user.name = name.trim();
    user.surname = surname.trim();
    user.bio = bio.trim();
    user.phone = phone.trim();
    user.skills = [
      ...new Set(skills.map((skill) => skill.trim())),
    ];

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("PATCH profile:", error);

    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
