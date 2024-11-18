import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const CategoryModel = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },

    lastOpened: {
      type: String,
    },

    counter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
export default model("categories", CategoryModel);
