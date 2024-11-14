import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  emailOrPhone: {
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
});

export default model("users", UserSchema);
