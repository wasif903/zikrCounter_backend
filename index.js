import express from "express";
import User from "./routes/User.js"
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import ErrorHandler from "./utils/ErrorHandler.js";
import HandleConnectDatabase from "./utils/MongoConnection.js";
import CategoryRoutes from "./routes/CategoryRoutes.js";

const app = express();
dotenv.config();

HandleConnectDatabase();

app.use(express.json());
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["POST", "GET", "PATCH", "DELETE"]
}))

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_Cloud,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY
})


app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use("/api", User)
app.use("/api/categories", CategoryRoutes)


app.use(ErrorHandler)

app.listen(9000, () => {
    console.log("APP Listening To 9000")
})