import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title:String,
    company:String,
    location: String,
    link: String,
    description: String,
    dateScraped: { type: Date, default: Date.now },
})

export const Job = mongoose.model("Job", jobSchema);

