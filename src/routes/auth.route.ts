// In auth.route.ts - Add this log:
import express from "express";
import { AUTH_ROUTES } from "../constants/routes.constants.js";

const router = express.Router();

router.post(AUTH_ROUTES.SIGNUP, async (req, res) => {
  console.log("✅ Inside signup handler!");

  try {
    res.status(201).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export const authRoutes = router;
