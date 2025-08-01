import { Hono } from "hono"
import { connectDB } from "./db/mongo"
import {jobsRouter} from "./routes/jobs"

connectDB()