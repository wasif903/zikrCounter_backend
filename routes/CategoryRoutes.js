import express from "express";
import { HandleCount, HandleCreateCAtegory, HandleGetHistory, HandleGetSingleCat, HandleGetUserCategories } from "../controllers/CategoryController.js";

const router = express.Router();

router.post("/:userID/create-category", HandleCreateCAtegory);
router.get("/:userID/get-user-categories", HandleGetUserCategories);


router.post("/:userID/create-count/:catID", HandleCount);

router.get("/:userID/get-single-category/:catID", HandleGetSingleCat)

router.get("/:userID/history", HandleGetHistory)

export default router;
