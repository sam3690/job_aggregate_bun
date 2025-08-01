import { Hono } from "hono";
import type { Context } from "hono";
import { Job } from "../models/jobs";

export const jobsRouter = new Hono();

jobsRouter.get("/", async (c: Context) => {
    const jobs = await Job.find();
    return c.json(jobs);
});