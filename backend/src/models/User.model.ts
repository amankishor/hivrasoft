import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export type UserRole =
  | "customer"
  | "admin"
  | "super_admin";

export interface IUser extends Document {
  name: string;
  username?: string;
  passwordHash?: string;
  email: string;
  phone: string;

  role: UserRole;

  emailVerified: boolean;
  isActive: boolean;

  avatar?: {
    url: string;
    publicId: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "customer",
        "admin",
        "super_admin",
      ],
      default: "customer",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;
