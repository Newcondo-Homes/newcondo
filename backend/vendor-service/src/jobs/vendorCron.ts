// backend/vendor-service/src/jobs/vendorCron.ts
// Every scheduled vendor-network task (Africa/Lagos). Started once from
// combined-backend/src/app.ts. Each task is idempotent; a slow run is never
// overlapped by the next tick.
import cron from "node-cron";
import { accrueFromPaidPeriods } from "../services/fundAccrualService";
import { reconcileAssignments } from "../services/matchingService";
import { planAll, markMissedVisits } from "../services/schedulingService";
import { runReminderCalls } from "../services/reminderService";

type Task = { name: string; schedule: string; run: () => Promise<unknown> };

const TASKS: Task[] = [
  // money first: funds must exist before the planner books against them
  { name: "fund-accrual", schedule: "*/10 * * * *", run: () => accrueFromPaidPeriods() },
  { name: "vendor-match", schedule: "*/5 * * * *", run: () => reconcileAssignments() },
  { name: "visit-plan", schedule: "7,37 * * * *", run: () => planAll() },
  { name: "visit-missed", schedule: "15 0 * * *", run: () => markMissedVisits() },
  { name: "reminder-calls", schedule: "*/10 7-16 * * *", run: () => runReminderCalls() },
];

export function startVendorCron(): void {
  for (const t of TASKS) {
    let running = false;
    cron.schedule(t.schedule, async () => {
      if (running) return;
      running = true;
      try { console.log(`[vendor-cron] ${t.name}:`, await t.run()); }
      catch (e) { console.error(`[vendor-cron] ${t.name} failed:`, e); }
      finally { running = false; }
    }, { timezone: "Africa/Lagos" });
  }
  console.log(`[vendor-cron] scheduled ${TASKS.length} tasks`);
}
