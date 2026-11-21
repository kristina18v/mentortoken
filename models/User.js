
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    surname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["startup", "mentor"],
      required: true,
    },

    bio: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: "",
    },
    settings: {
  profileVisible: {
    type: Boolean,
    default: true,
  },
  showPhone: {
    type: Boolean,
    default: false,
  },
  availableForJobs: {
    type: Boolean,
    default: true,
  },
  jobInterests: {
    type: [String],
    default: [],
  },
  language: {
    type: String,
    enum: ["en", "mk"],
    default: "en",
  },
  dateFormat: {
    type: String,
    enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    default: "DD/MM/YYYY",
  },
  timezone: {
    type: String,
    default: "Europe/Skopje",
  },
},
    resetPasswordToken: {
        type: String,
        default: null,
        select: false,
    },

    resetPasswordTokenExpiration: {
        type: Date,
        default: null,
        select: false,
    }

  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);
