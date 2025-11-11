import { NextFunction, Request, Response } from "express";
import { userService } from "../services/user.service";

export const signUpUser = async (data: any) => {
  console.log("✅ Inside signup controller!");

  try {
    await userService.createUser(data);
    // res.status(201).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Signup error:", error);
  }
};
