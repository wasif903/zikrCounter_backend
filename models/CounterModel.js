import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const CounterModel = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    catID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
    },
  },
  {
    timestamps: true,
  }
);
export default model("counters", CounterModel);
