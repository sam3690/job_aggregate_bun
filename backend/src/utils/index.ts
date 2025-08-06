import crypto from "crypto";

export function fingerprintFor(title?: string, company?: string, location?:string): string{
    const str =`${title ??""}|${company??""}|${location ?? ""}`.trim().toLowerCase();
    return crypto.createHash("sha256").update(str).digest("hex");
}

export async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 3000){
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), ms)
    try {
        const res = await fetch(url, {...opts, signal: controller.signal})
        clearTimeout(id)
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return await res.json()
    } catch (err: unknown) {
        clearTimeout(id)
        throw err        
    }
}