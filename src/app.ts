import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
// app.use("/api/users", userRoutes);

export default app;
