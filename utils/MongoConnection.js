import mongoose from "mongoose";

const HandleConnectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Error Occured While Connecting Database: " + error.message);
    console.log(error);
  }
};

export default HandleConnectDatabase;
