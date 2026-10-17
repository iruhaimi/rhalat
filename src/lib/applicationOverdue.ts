interface StatusTimestamp {
  created_at: string;
}

interface OverdueApplication {
  status: string;
  updated_at: string | null;
  application_status_history?: StatusTimestamp[];
}

export function isApplicationOverdue(application: OverdueApplication, now = Date.now()): boolean {
  // Approved and rejected are the completed outcomes in the application lifecycle.
  if (['approved', 'rejected', 'cancelled', 'completed'].includes(application.status)) return false;

  const historyTimes = (application.application_status_history ?? [])
    .map(entry => Date.parse(entry.created_at))
    .filter(Number.isFinite);
  const lastStatusChange = historyTimes.length > 0
    ? Math.max(...historyTimes)
    : Date.parse(application.updated_at ?? '');

  return Number.isFinite(lastStatusChange) && now - lastStatusChange > 3 * 24 * 60 * 60 * 1000;
}