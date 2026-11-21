
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "General",
    },

    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "assigned", "completed"],
      default: "open",
    },
    startupDeleted: {
  type: Boolean,
  default: false,
},

mentorDeleted: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

export default mongoose.models.Job ||
  mongoose.model("Job", jobSchema);
