import express from "express";
import { HandleGetAllUsers } from "../controllers/UserController.js";

const router = express.Router();


router.get("/get-users", HandleGetAllUsers)


export default router;