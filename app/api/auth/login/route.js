
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { createToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

// POST /api/auth/login
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return NextResponse.json(
        {
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user and include password
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Check whether password exists
    if (!user.password) {
      console.error(
        "Missing password hash for user:",
        user._id.toString()
      );

      return NextResponse.json(
        {
          message:
            "Unable to verify password. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );
    console.log("LOGIN PASSWORD CHECK:", {
  userId: user._id.toString(),
  validPassword: isPasswordValid,
});

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }
    console.log("LOGIN PASSWORD CHECK:", {
  userId: user._id.toString(),
  validPassword: isPasswordValid,
});

    // Create JWT token
    const token = createToken(user._id.toString());

    // Return user data
    const response = NextResponse.json(
      {
        status: "success",
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 200 }
    );

    // Set authentication cookie
    response.cookies.set("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        message:
          "An error occurred during login. Please try again.",
      },
      { status: 500 }
    );
  }
}
