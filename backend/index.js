import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs/promises";
import mammoth from "mammoth";
import dotenv from "dotenv";
import mongoose from "mongoose";
import candidateRouter from "./routes/candidate.js";
import interviewRouter from "./routes/interview.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection failed:", err));
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Interview AI Backend is running");
});
app.use('/auth', authRouter);
app.use('/candidates', candidateRouter);
app.use('/api', interviewRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
