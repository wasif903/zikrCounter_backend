import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    OtpCode: {
      type: Number,
    },
    OtpExp: {
      type: Number,
    },
    profileImg: {
      type: String,
      default: ""
    },
  },
  {
    timestamps: true,
  }
);

export default model("users", UserSchema);
