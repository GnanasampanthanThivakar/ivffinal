export type PredictReq = {
  userId: string;
  dateTimeISO: string;
  HR_sensor: number;
  Heart_Rate_Variability: number;
  Sleep_Hours: number;
  steps_sensor: number;
  stressPercent?: number;
};

export type PredictRes = {
    currentStressLevel: string;
    activitySuggested?: string | null;
    alert: null | { from?: string; to?: string; message?: string };
  
    unreadCount?: number;

  activityDescription?: string | null;
  activityGoal?: string | null;
  activityDurationMin?: number | null;
  supportMessage?: string | null;
  category?: string | null;
};

export type AlertsListReq = {
  userId: string;
  limit?: number;
};

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

export type AlertsMarkReadReq = {
  userId: string;
};

export type AlertsMarkReadRes = {
  status: "ok";
};

export type ActivitiesListReq = {
  userId: string;
  limit?: number;
};

export type ActivitiesListRes = {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    durationMin: number;
    category: string;
    createdAt?: string | null;
  }>;
};

export type SmsTestReq = {
  userId: string;
  message?: string;
  phones?: string[];
};

export type SmsTestRes = {
  status: string;
  phone?: string;
  phones?: string[];
  details?: string;
  metaResponse?: Record<string, any>;
};

export type ForgotPinReq = {
  loginId: string;
  primaryPhone: string;
  newPin?: string;
  newPassword?: string;
};

export type ForgotPinRes = {
  status: string;
  detail: string;
};

export type ResolveLoginIdReq = {
  loginId: string;
};

export type ResolveLoginIdRes = {
  status: string;
  email: string;
};

export type WeeklyReportReq = {
  userId: string;
  days: number;
};

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

export type ActivityRecommendReq = {
  metrics?: Record<string, any>;
};

export type ActivityRecommendRes = {
  activitySuggested: string;
  confidence: number;
  activityDescription?: string | null;
  activityGoal?: string | null;
  activityDurationMin?: number | null;
  supportMessage?: string | null;
  category?: string | null;
  top3?: Array<{
    activitySuggested: string;
    prob: number;
    category?: string;
  }>;
};

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function getBaseCandidates() {
  const envUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
    (process.env.REACT_APP_API_BASE_URL as string | undefined);

  if (envUrl && envUrl.startsWith("http")) {
    const clean = stripTrailingSlash(envUrl);
    return [
      clean,
      clean.endsWith("/wellness") ? clean.replace(/\/wellness$/, "") : `${clean}/wellness`,
    ];
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    return [
      `http://${host}:8000/wellness`,
      `http://${host}:8000`,
    ];
  }

  return [
    "http://10.0.2.2:8000/wellness",
    "http://10.0.2.2:8000",
  ];
}

const BASE_CANDIDATES = getBaseCandidates();

async function tryPost<T>(baseUrl: string, path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${baseUrl}${path} failed: ${res.status} ${txt}`);
  }

  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: any): Promise<T> {
  let lastError: any = null;

  for (const base of BASE_CANDIDATES) {
    try {
      return await tryPost<T>(base, path, body);
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError || new Error(`All API base URLs failed for ${path}`);
}

export function apiPredict(payload: PredictReq) {
  return postJson<PredictRes>("/predict", payload);
}

export function apiWeeklyReport(payload: WeeklyReportReq) {
  return postJson<WeeklyReportRes>("/weekly-report", payload);
}

export function apiAlertsList(payload: AlertsListReq) {
  return postJson<AlertsListRes>("/alerts/list", payload);
}

export function apiAlertsMarkRead(payload: AlertsMarkReadReq) {
  return postJson<AlertsMarkReadRes>("/alerts/mark-read", payload);
}

export function apiActivitiesList(payload: ActivitiesListReq) {
  return postJson<ActivitiesListRes>("/activities/list", payload);
}

export function apiActivityRecommend(payload: ActivityRecommendReq) {
  return postJson<ActivityRecommendRes>("/activity/recommend", payload);
}

export function apiAlertsTestSms(payload: SmsTestReq) {
  return postJson<SmsTestRes>("/alerts/test-sms", payload);
}

export function apiForgotPin(payload: ForgotPinReq) {
  return postJson<ForgotPinRes>("/auth/forgot-pin", payload);
}

export function apiAuthResolveLoginId(payload: ResolveLoginIdReq) {
  return postJson<ResolveLoginIdRes>("/auth/resolve-login-id", payload);
}

export function apiSignupSendOtp(payload: { phone: string }) {
  return postJson<{ status: string; detail: string }>("/signup/send-otp", payload);
}

export function apiSignupVerifyOtp(payload: { phone: string; otp: string }) {
  return postJson<{ status: string; detail: string }>("/signup/verify-otp", payload);
}

export function apiEmailChangeRequest(payload: { userId: string; newEmail: string }) {
  return postJson<{ status: string; detail: string }>("/email-change/request", payload);
}

export function apiEmailChangeVerify(payload: { userId: string; newEmail: string; otp: string }) {
  return postJson<{ status: string; detail: string }>("/email-change/verify", payload);
}
