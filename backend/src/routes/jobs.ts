import { Hono } from "hono";
import type { Context } from "hono";
import mongoose from "mongoose";
import { Job } from "../models/jobs";

export const jobsRouter = new Hono();

function parseListparams(c: Context){
    const url = c.req.url ? new URL(c.req.url): null;
    const qp = url?.searchParams

    const page = qp?.get("page") ? Math.max(1, Number (qp.get("page"))) : 1;
    const limit = qp?.get("limit") ? Math.max(1, Math.min(200, Number(qp.get("limit")))) : 20
    const skip = (page - 1) * limit;

    const sortBy = qp?.get('sortBy') || "dateScraped";
    const sortOrder = qp?.get('sortOrder') === "asc" ? 1 : -1;

    const filters:any = {}
    const title = qp?.get("title")
    const company = qp?.get("company")
    const location = qp?.get("location")
    const q = qp?.get("q") //general search keyword accross title, company, description


    if(title) filters.title = new RegExp(title, "i")
    if(company) filters.company = new RegExp(company, "i")
    if(location) filters.location = new RegExp(location, "i")
    if(q) {
        filters.$or = [
            { title: new RegExp(q, "i") },
            { company: new RegExp(q, "i") },
            { description: new RegExp(q, "i") }
        ];
    }

    return { page, limit, skip, sort:{sortBy, sortOrder}, filters }
}

/**
 * GET /jobs
 * Query params:
 *  - page (default 1)
 *  - limit (default 20, max 200)
 *  - title, company, location (filters; substring, case-insensitive)
 *  - q (general keyword search across title/description/company)
 *  - sortBy (dateScraped | title | company)
 *  - sortOrder (asc | desc)
 */

jobsRouter.get("/", async (c: Context) => {
    try {
        
    } catch (err) {
        console.error("Error fetching jobs:", err);
        return c.json({ error: "Failed to fetch jobs" }, 500);
    }
});