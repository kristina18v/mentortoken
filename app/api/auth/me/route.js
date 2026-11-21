
import { protect } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await protect(request);

    if (!user) {
      return Response.json(
        { message: "Не сте најавени" },
        { status: 401 }
      );
    }

    return Response.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          role: user.role,
          bio: user.bio,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Me API error:", error);

    return Response.json(
      { message: "Грешка при преземање на корисникот" },
      { status: 500 }
    );
  }
}
