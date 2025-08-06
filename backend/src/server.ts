import { Hono } from "hono"
import { connectDB } from "./db/mongo"
import {jobsRouter} from "./routes/jobs"
import {fetchRemoteOkJobs, fetchRemoteOkLive} from "./services/jobFetcher"
import {agentSearch} from "./routes/agentSearch"

const app = new Hono()

//Connect to MongoDB
connectDB()

app.route("/jobs", jobsRouter)
app.route("/agent/search", agentSearch)

const Port = Number(process.env.PORT || 5000)

Bun.serve({
    fetch: app.fetch,
    port: Port
})

console.log(`Server running on http://localhost:${Port}`);


(async () => {
    try {
        fetchRemoteOkJobs().catch(err => console.error("Initial fetch error:", err))

        setInterval(() => {
           fetchRemoteOkJobs().catch(err => console.error("Scheduled fetch error:", err));
        }, 1000 * 60 * 5)
        
    } catch (err) {
        console.error("Background fetch scheduler failed to start:",err);
                
    }
})()



// const remoteOkJobs = await fetchRemoteOkJobs()
// console.log("Fetched RemoteOK jobs:", remoteOkJobs);
