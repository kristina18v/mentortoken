
import { NextResponse } from "next/server";
import User from "@/models/User";
import Job from "@/models/Job";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    // 1. Get all registered mentors
    const mentors = await User.find({
      role: "mentor",
    })
      .select(
        "name surname role avatar photoUrl profileImage createdAt phone skills bio"
      )
      .lean();

    // 2. Count completed jobs for each mentor
    const completedJobs = await Job.aggregate([
      {
        $match: {
          status: "completed",
          mentorId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$mentorId",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Create lookup map
    const completedJobsMap = new Map(
      completedJobs.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    // 4. Combine mentors with statistics
    const rankedMentors = mentors.map((mentor) => {
      const mentorId = String(mentor._id);

      return {
        _id: mentorId,
        name: mentor.name || "",
        surname: mentor.surname || "",
        role: mentor.role,

        avatar:
          mentor.avatar ||
          mentor.photoUrl ||
          mentor.profileImage ||
          "",

        // Mentor profile information
        bio: mentor.bio || "",
        phone: mentor.phone || "",
        skills: Array.isArray(mentor.skills)
          ? mentor.skills
          : [],

        // Real completed jobs count
        completedJobs: completedJobsMap.get(mentorId) || 0,
      };
    });

    // 5. Rank by completed jobs
    rankedMentors.sort(
      (a, b) =>
        b.completedJobs - a.completedJobs ||
        `${a.name} ${a.surname}`.localeCompare(
          `${b.name} ${b.surname}`
        )
    );

    return NextResponse.json(
      {
        success: true,
        mentors: rankedMentors,
        count: rankedMentors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/mentors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load mentors.",
      },
      { status: 500 }
    );
  }
}
