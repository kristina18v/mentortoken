
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function PATCH(request, { params }) {
  try {
    const { token } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Please submit both password fields." }, { status: 400 });
    }
    const { password, confirmPassword } = body || {};

    if (
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      !password ||
      !confirmPassword
    ) {
      return Response.json(
        { message: "Please enter and confirm your new password." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          message:
            "Your password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return Response.json(
        { message: "The passwords do not match." },
        { status: 400 }
      );
    }

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return Response.json(
        { message: "This reset link is invalid or has expired. Please request a new link." },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiration: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return Response.json(
        {
          message: "This reset link is invalid or has expired. Please request a new link.",
        },
        { status: 400 }
      );
    }

    // Hash на новата лозинка
    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // Атомско ажурирање: токенот се троши еднаш
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpiration: {
          $gt: new Date(),
        },
      },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordTokenExpiration: "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return Response.json(
        {
          message: "This reset link is invalid or has expired. Please request a new link.",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        ok: true,
        message: "Your password has been reset. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password failed", { type: error?.name || "Error" });

    return Response.json(
      {
        message: "Password reset is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }
}
