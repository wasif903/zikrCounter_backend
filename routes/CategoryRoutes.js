import express from "express";
import { HandleCount, HandleCreateCAtegory, HandleGetUserCategories } from "../controllers/CategoryController.js";

const router = express.Router();

router.post("/:userID/create-category", HandleCreateCAtegory);
router.get("/:userID/get-user-categories", HandleGetUserCategories);


router.post("/:userID/create-count/:catID", HandleCount);

// router.get("")

export default router;
