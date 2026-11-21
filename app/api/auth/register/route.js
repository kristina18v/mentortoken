
import bcrypt from "bcryptjs";

import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import sendEmail from "@/lib/sendEmail";
import { welcomeEmailTemplate } from "@/lib/emailTemplates";

export async function POST(request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const surname =
      typeof body.surname === "string"
        ? body.surname.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password = body.password;
    const role = body.role;

    // Validate required fields
    if (
      !name ||
      !surname ||
      !email ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate account role
    if (!["startup", "mentor"].includes(role)) {
      return Response.json(
        { message: "Invalid account type." },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return Response.json(
        {
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return Response.json(
        {
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword,
      role,
    });

    // Send welcome email without failing registration
    try {
      await sendEmail({
        options: {
          to: newUser.email,
          subject: "Welcome to MentorToken!",
          text:
            `Hello ${newUser.name}, ` +
            "welcome to MentorToken! " +
            "Your account has been created successfully.",
          html: welcomeEmailTemplate({
            name: newUser.name,
          }),
        },
      });
    } catch (emailError) {
      console.error(
        "Welcome email failed:",
        emailError
      );
    }

    return Response.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser._id,
          name: newUser.name,
          surname: newUser.surname,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return Response.json(
        {
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        message:
          "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
