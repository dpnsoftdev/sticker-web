import { startProductViewFlushScheduler } from "./productViewFlush.job";
import { startReleaseExpiredReservationsScheduler } from "./releaseExpiredReservations.job";

/**
 * Starts all in-process cron-style intervals. Returns handles so the process can clear them on shutdown.
 * (Product view flush is omitted when REDIS_URL is unset.)
 */
export function startAllCronJobs(): NodeJS.Timeout[] {
  const timers: NodeJS.Timeout[] = [];

  const productViewFlush = startProductViewFlushScheduler();
  if (productViewFlush) {
    timers.push(productViewFlush);
  }

  timers.push(startReleaseExpiredReservationsScheduler());

  return timers;
}

export { startProductViewFlushScheduler } from "./productViewFlush.job";
export {
  startReleaseExpiredReservationsScheduler,
  releaseExpiredReservationsOnce,
} from "./releaseExpiredReservations.job";
export { flushProductViewBufferOnce } from "./productViewFlush.job";
