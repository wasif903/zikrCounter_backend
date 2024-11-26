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

    image: {
      type: String,
    },

    lastOpened: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
export default model("categories", CategoryModel);
