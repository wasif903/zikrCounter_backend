import express from "express";
import { HandleCreateCAtegory, HandleGetUserCategories } from "../controllers/CategoryController.js";

const router = express.Router();

router.post("/:userID/create-category", HandleCreateCAtegory);
router.get("/:userID/get-user-categories", HandleGetUserCategories);

export default router;
