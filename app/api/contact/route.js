
export async function POST(request) {
  try {
    // 1. Преземи ги податоците од формата
    const { name, email, message } = await request.json();

    // 2. Провери дали се пополнети полињата
    if (!name || !email || !message) {
      return Response.json(
        { message: "Please fill in all fields." },
        { status: 400 }
      );
    }

    // 3. Провери дали email адресата е валидна
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return Response.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 4. Провери ја должината на пораката
    if (name.length < 2 || name.length > 100 ||
        message.length < 10 || message.length > 5000) {
      return Response.json(
        { message: "Please check your name and message length." },
        { status: 400 }
      );
    }

    // 5. Преземи ги Resend податоците
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL;

    if (!apiKey || !from || !to) {
      return Response.json(
        { message: "Email service is not configured." },
        { status: 503 }
      );
    }

    // 6. Испрати email преку Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `MentorToken Contact: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    // 7. Провери дали email е прифатен
    if (!response.ok) {
      return Response.json(
        { message: "Failed to send message. Please try again." },
        { status: 502 }
      );
    }

    // 8. Успешен одговор
    return Response.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Contact API error:", error.message);

    return Response.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
