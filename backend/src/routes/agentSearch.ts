import { Hono } from "hono";
import type { Context } from "hono";
import { Job } from "../models/jobs.js";
import type { CanonicalJob } from "../types.js";
import { fingerprintFor } from "../utils/index.js";
import { fetchRemoteOkLive } from "../services/jobFetcher.js";

export const agentSearch = new Hono()

function buildDbFilter(profile: any, query?:string){
    const filter: any = {}

    if (profile?.locations && Array.isArray(profile.locations) && profile.locations.length ){
        filter.location = {$in: profile.locations}
    }

    if(query && typeof query === "string" && query.trim().length){
        const q = query.trim()
        filter.$or = [
            {title: new RegExp(q, "i")},
            {description: new RegExp(q, "i")},
            {company: new RegExp(q, "i")},
        ]
    }

    return filter
}


agentSearch.post("/", async (c: Context) => {
    try {
        const body = await c.req.json().catch(() => ({}))
        const {profile, query} = body as {profile?: any; query?: string}

        const dbFilter = buildDbFilter(profile, query)
        const dbResults = await Job.find(dbFilter)
        .sort({dateScraped: -1})
        .limit(100)
        .lean()
        .exec()

        const livePromise = fetchRemoteOkLive(3000)
        const liveSettled = await Promise.allSettled([livePromise])



        const liveResults: CanonicalJob[] = []
        for(const s of liveSettled){
            if(s.status === "fulfilled" && Array.isArray(s.value)){
                liveResults.push(...s.value)
            }
        }


        const seen = new Set<string>()
        for(const d of dbResults){
            if (d.link) seen.add(d.link);
            if (d.fingerprint) seen.add(d.fingerprint);
            else seen.add(fingerprintFor(d.title, d.company, d.location));
        }

        const newCandidates: CanonicalJob[] = []
        for(const job of liveResults){
            const fp = job.fingerprint ?? fingerprintFor(job.title, job.company, job.location);
            const link = job.link
            if (link && seen.has(link) || seen.has(fp)) continue
            seen.add(fp)
            if (link) seen.add(link)
            job.fingerprint = fp
            newCandidates.push(job)
        }


        (async () => {
            try {
                for (const cand of newCandidates){
                    const filter = cand.link? {lnk: cand.link} : {fingerprint: cand.fingerprint}
                    await Job.updateOne(
                        filter,
                        {
                            $set:{
                                title: cand.title,
                                company: cand.company,
                                location: cand.location,
                                link: cand.link,
                                description: cand.description,
                                source: cand.source,
                                postedAt: cand.postedAt,
                                fingerprint: cand.fingerprint,
                                dateScraped: new Date(),
                            },
                        },
                        {upsert: true}
                    ).exec()
                }
            } catch (err) {
                console.error("Background upsert error in /agent/search:", (err as Error).message ?? err);
                
            }
        })()

        const combined = [...dbResults, ...newCandidates].slice(0, 50)

        return c.json({
            success: true,
            count: combined.length,
            results: combined
        })
    } catch (err) {
        console.error("/agent/search error:", (err as Error)?.message ?? err);
        return c.json({success: false, error: (err as Error)?.message ?? "Unknown error", status: 500})
    }
})