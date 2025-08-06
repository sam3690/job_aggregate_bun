// src/types.ts
export interface CanonicalJob {
  title: string;
  company?: string;
  location?: string;
  link?: string;
  description?: string;
  source: string;
  postedAt?: Date;
  fingerprint?: string;
}
