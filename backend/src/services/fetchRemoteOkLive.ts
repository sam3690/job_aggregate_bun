import { fetchWithTimeout } from "../utils";
import type { CanonicalJob } from "../types";

export async function fetchRemoteOkJobs(timeout = 3000): Promise<CanonicalJob[]> {
    try {
        const data = await fetchWithTimeout("https://remoteok.com/api", {}, timeout);
        const arr  = Array.isArray(data) ? data.slice(1) : [];
        return arr.map((j: any) => ({
            title: j.position || j.title || "Untitled",
            company: j.company,
            location: j.location,
            link: j.url,
            description: j.description || j.tags?.join(", ") || "",
            source: "RemoteOK",
            postedAt: j.date ? new Date(j.date) : undefined,
        }))
    } catch (err) {
        console.warn("RemoteOK fetch failed:", (err as Error)?.message ?? err);
        return [];
    }
}