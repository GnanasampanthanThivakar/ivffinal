import { fetchAlertsForUser, AlertItem, StressLevel } from "./firestoreService";

export type { AlertItem, StressLevel };

// Alerts come from Firestore now (no mock, no api.ts)
export async function fetchAlerts(userId: string): Promise<AlertItem[]> {
  return await fetchAlertsForUser(userId);
}
