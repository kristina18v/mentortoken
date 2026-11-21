
import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    mentorDeleted: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

jobApplicationSchema.index(
  { jobId: 1, mentorId: 1 },
  { unique: true }
);

export default mongoose.models.JobApplication ||
  mongoose.model("JobApplication", jobApplicationSchema);
