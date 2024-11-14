import express from "express";
import {
  HandleForgotPassword,
  HandleGetAllUsers,
  HandleLogin,
  HandleResendOtp,
  HandleResetPassword,
  HandleSignup,
  HandleVerifyOtp,
} from "../controllers/UserController.js";

const router = express.Router();

router.get("/get-users", HandleGetAllUsers);


router.post("/signup", HandleSignup);

router.post("/login", HandleLogin);

router.patch("/forget-password", HandleForgotPassword);

router.patch("/verify-otp", HandleVerifyOtp);

router.patch("/reset-password", HandleResetPassword);

router.patch("/resend-otp", HandleResendOtp);


export default router;