import mongoose from "mongoose";
import { config } from "dotenv";


config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/job_scraper";


export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process with failure        
    }
}