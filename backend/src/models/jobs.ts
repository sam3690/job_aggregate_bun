import mongoose, {Schema, Document} from "mongoose";

export interface IJob extends Document {
  title: string;
  company?: string;
  location?: string;
  link: string;
  description?: string;
  source?: string;
  postedAt?: Date;
  fingerprint?: string;
  dateScraped: Date;
}

const jobSchema = new mongoose.Schema<IJob>({
    title:{ type: String, required: true },
    company:{ type: String, required: true },
    location:{ type: String,  },
    link:{ type: String, required: true },
    description:{ type: String, },
    source: {type:String, index: true},
    postedAt: { type: Date,},
    fingerprint: {type: String, index: true },
    dateScraped: {
        type: Date,
        default: Date.now,
        index: { expires: '30d' } // TTL: auto-delete after 30 days
    },
})

jobSchema.index({ link: 1}, { unique: true, sparse: true });

export const Job = mongoose.model<IJob>("Job", jobSchema);

