// In auth.route.ts - Add this log:
import express from "express";
import { USER_ROUTES } from "../constants/routes.constants.js";
import { signUpUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post(USER_ROUTES.SIGNUP, async (req, res) => {
  console.log("✅ Inside signup handler!");

  await signUpUser(req.body);

  try {
    res.status(201).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export const userRoutes = router;
