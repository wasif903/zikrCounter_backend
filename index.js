import express from "express";
import User from "./routes/User.js"
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import ErrorHandler from "./utils/ErrorHandler.js";
import HandleConnectDatabase from "./utils/MongoConnection.js";
import CategoryRoutes from "./routes/CategoryRoutes.js";
import { CounterService } from "./sockets/CounterService.js";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
dotenv.config();

HandleConnectDatabase();

const httpServer = createServer(app);

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

app.get("/", (req ,res ) => {
    res.status(200).json({message: "Backend Is Live!"})
})

app.use("/api", User)
app.use("/api/categories", CategoryRoutes)

app.use(ErrorHandler)

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ['GET', "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
});


CounterService(io);

httpServer.listen(process.env.PORT || 8000, () => {
    console.log(`APP Listening To ${process.env.PORT || 8000}`)

})
// app.listen(8000, () => {
//     console.log("APP Listening To 9000")
// })