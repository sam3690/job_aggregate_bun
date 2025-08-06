// src/services/jobFetcher.ts
import { Job } from "../models/jobs.js";
import type { CanonicalJob } from "../types.js";
import crypto from "crypto";

interface RemoteOKJob {
  position?: string;
  title?: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
  url?: string;
  date?: string;
}

// helper fingerprint
function fingerprintFor(title?: string, company?: string, location?: string) {
  const str = `${title ?? ""}|${company ?? ""}|${location ?? ""}`.trim().toLowerCase();
  return crypto.createHash("sha256").update(str).digest("hex");
}

/** Lightweight live fetcher — returns normalized jobs (no DB writes) */
export async function fetchRemoteOkLive(timeout = 3000): Promise<CanonicalJob[]> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const res = await fetch("https://remoteok.com/api", { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as RemoteOKJob[];
    const arr = Array.isArray(data) ? data.slice(1) : [];

    return arr.map((j: any) => ({
      title: j.position || j.title || "Untitled",
      company: j.company,
      location: j.location,
      link: j.url,
      description: j.description || (j.tags?.join(", ") || ""),
      source: "RemoteOK",
      postedAt: j.date ? new Date(j.date) : undefined,
      fingerprint: fingerprintFor(j.position || j.title, j.company, j.location),
    }));
  } catch (err: unknown) {
    console.warn("RemoteOK live fetch failed:", (err as Error)?.message ?? err);
    return [];
  }
}

/** Save/upsert helper — ensures correct filter + update shape */
export async function saveJob(job: CanonicalJob) {
  const fp = job.fingerprint ?? fingerprintFor(job.title, job.company, job.location);

  // prefer link if present for dedupe, otherwise fingerprint
  const filter = job.link ? { link: job.link } : { fingerprint: fp };

  const updateDoc = {
    $set: {
      title: job.title,
      company: job.company,
      location: job.location,
      link: job.link,
      description: job.description,
      source: job.source,
      postedAt: job.postedAt,
      fingerprint: fp,
      dateScraped: new Date(),
    },
  };

  try {
    await Job.updateOne(filter, updateDoc, { upsert: true });
  } catch (err: unknown) {
    // duplicate key errors on sparse unique link index might occur if race conditions: handle gracefully
    console.error("saveJob error:", (err as Error).message ?? err);
  }
}

/** Background upsert: fetches from RemoteOK and upserts each job */
export async function fetchRemoteOkJobs() {
  try {
    const res = await fetch("https://remoteok.com/api");
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = (await res.json()) as RemoteOKJob[];
    const arr = Array.isArray(data) ? data.slice(1) : [];

    const normalized = arr
      .filter(j => j.url) // skip invalid entries without url
      .map((j: RemoteOKJob) => ({
        title: j.position || j.title || "Untitled",
        company: j.company || "Unknown",
        location: j.location || "Unknown",
        link: j.url!,
        description: j.description || (j.tags?.join(", ") || "No description available"),
        source: "RemoteOK",
        postedAt: j.date ? new Date(j.date) : undefined,
        fingerprint: fingerprintFor(j.position || j.title, j.company, j.location),
      })) as CanonicalJob[];

    // sequential upserts (you can parallelize with Promise.all but be mindful of DB load)
    for (const job of normalized) {
      await saveJob(job);
    }

    console.log(`Fetched and upserted ${normalized.length} RemoteOK jobs.`);
  } catch (err: unknown) {
    console.error("Failed to fetch RemoteOK jobs:", (err as Error)?.message ?? err);
  }
}
