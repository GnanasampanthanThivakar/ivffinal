export type PredictReq = {
  userId: string;
  dateTimeISO: string;
  HR_sensor: number;
  Heart_Rate_Variability: number;
  Sleep_Hours: number;
  steps_sensor: number;
};

export type PredictRes = {
  currentStressLevel: string;
  activitySuggested: string;
  alert: null | { from?: string; to?: string; message?: string };

  unreadCount?: number;

  activityDescription?: string | null;
  activityGoal?: string | null;
  activityDurationMin?: number | null;
  supportMessage?: string | null;
  category?: string | null;
};

export type AlertsListReq = { userId: string; limit?: number };
export type AlertsListRes = {
  userId: string;
  unreadCount: number;
  alerts: Array<{
    id: number | string;
    dateISO: string;
    fromLevel?: string | null;
    toLevel?: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
};

export type AlertsMarkReadReq = { userId: string };
export type AlertsMarkReadRes = { status: "ok" };

export type WeeklyReportReq = { userId: string; days: number };
export type WeeklyReportPoint = {
  dateISO: string;
  HR: number;
  HRV: number;
  SleepHours: number;
  Steps: number;
  StressLevel: string;
};

export type WeeklyReportRes = {
  userId: string;
  days: number;
  points: WeeklyReportPoint[];
};

export type ActivityCatalogItem = {
  id: string;
  title: string;
  description: string;
  category: "Mindfulness" | "Movement" | "Sleep" | "Wellness" | string;
  durationMin: number;
};

export type ActivitiesListRes = {
  activities: ActivityCatalogItem[];
};

function getBaseUrl() {
  const envUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
    (process.env.REACT_APP_API_BASE_URL as string | undefined);

  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }

  return "http://10.0.2.2:8000";
}

const BASE_URL = getBaseUrl();

async function postJson<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

export function apiPredict(payload: PredictReq) {
  return postJson<PredictRes>("/wellness/predict", payload);
}

export function apiWeeklyReport(payload: WeeklyReportReq) {
  return postJson<WeeklyReportRes>("/wellness/weekly-report", payload);
}

export function apiAlertsList(payload: AlertsListReq) {
  return postJson<AlertsListRes>("/wellness/alerts/list", payload);
}

export function apiAlertsMarkRead(payload: AlertsMarkReadReq) {
  return postJson<AlertsMarkReadRes>("/wellness/alerts/mark-read", payload);
}

export function apiActivitiesList() {
  return getJson<ActivitiesListRes>("/wellness/activities/list");
}