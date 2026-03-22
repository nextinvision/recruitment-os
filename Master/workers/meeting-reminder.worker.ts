/**
 * Meeting Reminder Worker
 * Processes TidyCal meeting reminders (24h, 1h, 15m before).
 * Run via cron every 5-15 minutes for reliable delivery.
 */

import { processMeetingReminders } from '@/modules/communications/meeting-reminder.service'

export async function runMeetingReminderWorker() {
  console.log('[Meeting Reminder] Starting...')
  try {
    const result = await processMeetingReminders()
    console.log(
      `[Meeting Reminder] Completed. Sent: ${result.sent.length}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
    )
    if (result.errors.length > 0) {
      result.errors.forEach((e) => console.error('[Meeting Reminder]', e))
    }
    return result
  } catch (error) {
    console.error('[Meeting Reminder] Error:', error)
    throw error
  }
}

// Allow direct execution: npx ts-node workers/meeting-reminder.worker.ts
if (require.main === module) {
  runMeetingReminderWorker()
    .then((r) => {
      console.log('Done:', r)
      process.exit(0)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
