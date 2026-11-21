import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// POST /api/auth/register
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { message: "Invalid JSON request." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { message: "Please provide the registration fields." },
        { status: 400 }
      );
    }

    const { name, surname, email, password, role } = body;

    if (
      [name, surname, email, password, role].some(
        (value) => typeof value !== "string" || !value.trim()
      )
    ) {
      return Response.json(
        { message: "Сите полиња се задолжителни" },
        { status: 400 }
      );
    }

    if (!["startup", "mentor"].includes(role)) {
      return Response.json(
        { message: "Невалиден тип на account" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { message: "Лозинката мора да има најмалку 8 карактери" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return Response.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        { message: "Корисник со овој email веќе постои" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    return Response.json(
      {
        status: "Success",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
            role: newUser.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // The unique email index also handles simultaneous registrations safely.
    if (err?.code === 11000) {
      return Response.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }
    if (err?.name === "ValidationError") {
      return Response.json(
        { message: "Please check your registration details." },
        { status: 400 }
      );
    }
    // Do not log request bodies, credentials, connection strings or full errors.
    console.error("REGISTER API ERROR", {
      type: err?.name || "Error",
      code: typeof err?.code === "number" ? err.code : undefined,
    });
    return Response.json(
      { message: "Registration is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
