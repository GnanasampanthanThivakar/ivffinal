import {
  apiPredict,
  apiWeeklyReport,
  apiAlertsList,
  apiAlertsMarkRead,
  apiActivitiesList,
} from "./backendApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StressLevel = "Low" | "Medium" | "High";

export type RecommendationItem = {
  id: string;
  title: string;
  desc: string;
  category: "Mindfulness" | "Movement" | "Sleep" | "Wellness";
  duration: string;
  durationMin?: number;
  startLabel?: string;
  supportMessage?: string;
  createdAt: string;
  isRead?: boolean;
};

export type TodayData = {
  hr?: number;
  hrv?: number;
  sleepHours?: number;
  steps?: number;
  stressPercent?: number;
  stressLevel?: StressLevel;
  modelReady?: boolean;
  alertsCount?: number;
  activitiesCount?: number;
  recommendation?: RecommendationItem;
  recommendationHistory?: RecommendationItem[];
  supportMessage?: string;
  stressChangeMessage?: string;
  latestAlertCreatedAt?: string;
  timestamp?: string;
};

const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NOTIFY_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

function isWeb() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

let device: BluetoothDevice | null = null;
let server: BluetoothRemoteGATTServer | null = null;
let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;

let online = false;
let lastLive: TodayData | null = null;
let currentLiveUserId = "";

type Listener = () => void;
const listeners = new Set<Listener>();

let buf = "";
let lastPredictAt = 0;
let lastAlertSyncAt = 0;
let activitiesBadgeDismissed = false;

function historyStorageKey(userId: string) {
  return `momera_recommendation_history_v1_${userId}`;
}

function activitySeenAtKey(userId: string) {
  return `momera_activity_seen_at_v1_${userId}`;
}

function resetLiveState() {
  lastLive = null;
  currentLiveUserId = "";
  buf = "";
  lastPredictAt = 0;
  lastAlertSyncAt = 0;
  activitiesBadgeDismissed = false;
}

function emit() {
  listeners.forEach((fn) => fn());
}

async function persistRecommendationHistory(userId: string, history: RecommendationItem[]) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      historyStorageKey(userId),
      JSON.stringify(history.slice(0, 20))
    );
  } catch (e) {
    console.log("persistRecommendationHistory error:", e);
  }
}

async function loadPersistedRecommendationHistory(userId: string) {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(historyStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeHistory(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.log("loadPersistedRecommendationHistory error:", e);
    return [];
  }
}

async function persistActivitySeenAt(userId: string, value: string) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(activitySeenAtKey(userId), value);
  } catch (e) {
    console.log("persistActivitySeenAt error:", e);
  }
}

async function loadActivitySeenAt(userId: string) {
  if (!userId) return null;
  try {
    return await AsyncStorage.getItem(activitySeenAtKey(userId));
  } catch (e) {
    console.log("loadActivitySeenAt error:", e);
    return null;
  }
}

export async function getStoredRecommendationHistory(userId: string) {
  return loadPersistedRecommendationHistory(userId);
}

export async function resetWatchUserSession(options?: {
  disconnect?: boolean;
  clearPersistedForUserId?: string;
}) {
  const userId = options?.clearPersistedForUserId || currentLiveUserId;

  if (options?.disconnect) {
    try {
      notifyChar?.stopNotifications?.();
    } catch {}
    try {
      server?.disconnect?.();
    } catch {}

    notifyChar = null;
    server = null;
    device = null;
    online = false;
  }

  if (userId) {
    try {
      await AsyncStorage.multiRemove([
        historyStorageKey(userId),
        activitySeenAtKey(userId),
      ]);
    } catch (e) {
      console.log("resetWatchUserSession storage cleanup error:", e);
    }
  }

  resetLiveState();
  emit();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getLocalDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function getLocalDateTimeISO(date = new Date()) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());

  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offH = pad2(Math.floor(Math.abs(offsetMin) / 60));
  const offM = pad2(Math.abs(offsetMin) % 60);

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`;
}

function hasValidPredictInputs(data?: TodayData | null) {
  if (!data) return false;
  return Number(data.hr ?? 0) > 0 && Number(data.hrv ?? 0) > 0;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampStressPercent(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function percentToStressLevel(percent?: number): StressLevel {
  const x = clampStressPercent(Number(percent ?? 0));
  if (x < 35) return "Low";
  if (x < 70) return "Medium";
  return "High";
}

function inferCategory(activityName: string, category?: string | null) {
  if (
    category === "Mindfulness" ||
    category === "Movement" ||
    category === "Sleep" ||
    category === "Wellness"
  ) {
    return category;
  }

  const x = (activityName || "").toLowerCase();

  if (x.includes("breath") || x.includes("meditation") || x.includes("music")) {
    return "Mindfulness";
  }
  if (x.includes("walk") || x.includes("stretch")) {
    return "Movement";
  }
  if (x.includes("sleep") || x.includes("rest")) {
    return "Sleep";
  }
  return "Wellness";
}

function buildRecoFromPredict(p: {
  activitySuggested?: string | null;
  activityDescription?: string | null;
  activityDurationMin?: number | null;
  category?: string | null;
  supportMessage?: string | null;
}): RecommendationItem {
  const durationMin = Number(p.activityDurationMin ?? 10);

  return {
    id: generateId(),
    title: p.activitySuggested || "Breathing Exercise",
    desc: p.activityDescription || "Try a gentle, supportive routine for a few minutes.",
    category: inferCategory(p.activitySuggested, p.category),
    duration: `${durationMin} min`,
    durationMin,
    startLabel: "Now",
    supportMessage: p.supportMessage ?? "",
    createdAt: getLocalDateTimeISO(),
    isRead: false,
  };
}

function recommendationKey(item?: Partial<RecommendationItem> | null) {
  return [
    item?.title ?? "",
    item?.category ?? "",
    item?.durationMin ?? item?.duration ?? "",
  ].join("__");
}

function normalizeHistory(items?: RecommendationItem[]) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    isRead: !!item?.isRead,
  }));
}

function countUnreadRecommendations(items?: RecommendationItem[]) {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => !item?.isRead).length;
}

function countUnseenBackendActivities(
  items?: Array<{ createdAt?: string | null }>,
  seenAt?: string | null
) {
  if (!Array.isArray(items)) return 0;
  if (!seenAt) return items.length;

  const seenTs = new Date(seenAt).getTime();
  if (!Number.isFinite(seenTs) || seenTs <= 0) return items.length;

  return items.filter((item) => {
    const createdTs = new Date(item?.createdAt || "").getTime();
    return Number.isFinite(createdTs) && createdTs > seenTs;
  }).length;
}

function mergeRecommendationHistory(
  nextReco: RecommendationItem,
  existingHistory: RecommendationItem[] = []
) {
  const normalizedExisting = normalizeHistory(existingHistory);

  return [
    {
      ...nextReco,
      isRead: false,
    },
    ...normalizedExisting,
  ].slice(0, 20);
}

/**
 * Watch provides live raw metrics.
 * Final stress classification is decided by backend predict flow.
 */
function normalizeWatchObj(obj: any): TodayData {
  const hr = Number(obj.hr ?? obj.heartRate ?? 0);
  const hrv = Number(obj.hrv ?? obj.Heart_Rate_Variability ?? 0);
  const sleepHours = Number(obj.sleepHours ?? obj.sleepHrs ?? 0);
  const steps = Number(obj.steps ?? 0);

  const watchStressPercent = clampStressPercent(
    Number(obj.stressPercent ?? lastLive?.stressPercent ?? 0)
  );
  const recommendationHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);
  const unreadRecommendations = countUnreadRecommendations(recommendationHistory);
  const activitiesCount = activitiesBadgeDismissed ? 0 : unreadRecommendations;

  return {
    hr,
    hrv,
    sleepHours,
    steps,
    stressPercent: watchStressPercent,
    stressLevel: lastLive?.stressLevel ?? "Low",
    modelReady: !!lastLive?.modelReady,
    timestamp: getLocalDateISO(),
    alertsCount: lastLive?.alertsCount ?? 0,
    activitiesCount,
    recommendation: recommendationHistory[0] ?? lastLive?.recommendation,
    recommendationHistory,
    supportMessage: lastLive?.supportMessage ?? "",
    stressChangeMessage: lastLive?.stressChangeMessage ?? "",
    latestAlertCreatedAt: lastLive?.latestAlertCreatedAt ?? "",
  };
}

export function subscribeWatchLive(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isWatchOnline() {
  return online;
}

export function getLiveToday(): TodayData | null {
  return lastLive;
}

export function setLiveUnreadCount(
  count: number,
  latestAlertMessage?: string,
  latestAlertCreatedAt?: string
) {
  const recommendationHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);
  const unreadRecommendations = countUnreadRecommendations(recommendationHistory);
  const activitiesCount = activitiesBadgeDismissed ? 0 : unreadRecommendations;

  if (!lastLive) {
    lastLive = {
      hr: 0,
      hrv: 0,
      sleepHours: 0,
      steps: 0,
      stressPercent: 0,
      stressLevel: "Low",
      modelReady: false,
      timestamp: getLocalDateISO(),
      alertsCount: count,
      activitiesCount,
      recommendation: undefined,
      recommendationHistory,
      supportMessage: "",
      stressChangeMessage: latestAlertMessage ?? "",
      latestAlertCreatedAt: latestAlertCreatedAt ?? "",
    };
  } else {
    lastLive = {
      ...lastLive,
      alertsCount: count,
      activitiesCount,
      recommendationHistory,
      recommendation: recommendationHistory[0] ?? lastLive.recommendation,
      stressChangeMessage: latestAlertMessage ?? lastLive.stressChangeMessage ?? "",
      latestAlertCreatedAt: latestAlertCreatedAt ?? lastLive.latestAlertCreatedAt ?? "",
    };
  }

  emit();
}

export async function syncUnreadCount(userId: string, force = false) {
  if (!userId) return;
  currentLiveUserId = userId;

  try {
    const now = Date.now();
    if (!force && now - lastAlertSyncAt < 20000) return;
    lastAlertSyncAt = now;

    const res = await apiAlertsList({ userId, limit: 1 });
    const latest = res?.alerts?.[0];

    setLiveUnreadCount(
      Number(res?.unreadCount ?? 0),
      latest?.message ?? "",
      latest?.createdAt ?? ""
    );
  } catch (e) {
    console.log("syncUnreadCount error:", e);
  }
}

export async function markAllAlertsReadAndSync(userId: string) {
  try {
    await apiAlertsMarkRead({ userId });

    setLiveUnreadCount(
      0,
      lastLive?.stressChangeMessage ?? "",
      lastLive?.latestAlertCreatedAt ?? ""
    );

    await syncUnreadCount(userId, true);
  } catch (e) {
    console.log("markAllAlertsReadAndSync error:", e);
  }
}

export function clearLiveAlertsUnreadVisualOnly() {
  if (!lastLive) return;

  lastLive = {
    ...lastLive,
    alertsCount: 0,
  };

  emit();
}

export function clearLiveActivitiesUnreadVisualOnly() {
  if (!currentLiveUserId) return;
  activitiesBadgeDismissed = true;
  persistActivitySeenAt(currentLiveUserId, getLocalDateTimeISO());

  if (!lastLive) return;

  const recommendationHistory = normalizeHistory(lastLive.recommendationHistory ?? []).map(
    (item) => ({
      ...item,
      isRead: true,
    })
  );

  lastLive = {
    ...lastLive,
    activitiesCount: 0,
    recommendationHistory,
    recommendation: recommendationHistory[0] ?? lastLive.recommendation,
  };

  emit();
  persistRecommendationHistory(currentLiveUserId, recommendationHistory);
}

export function markAllRecommendationsRead() {
  if (!currentLiveUserId) return;
  activitiesBadgeDismissed = true;
  persistActivitySeenAt(currentLiveUserId, getLocalDateTimeISO());

  const existingHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);
  if (!existingHistory.length) return;

  const nextHistory = existingHistory.map((item) => ({
    ...item,
    isRead: true,
  }));

  lastLive = {
    ...(lastLive || {}),
    recommendationHistory: nextHistory,
    recommendation: nextHistory[0] ?? lastLive?.recommendation,
    activitiesCount: 0,
  };

  emit();
  persistRecommendationHistory(currentLiveUserId, nextHistory);
}

/**
 * Backend is used for:
 * - stress classification
 * - recommendation
 * - support message
 * - alert message
 * - unread count
 */
async function runPredict(userId: string, data: TodayData) {
  if (!userId) return;
  currentLiveUserId = userId;

  const now = Date.now();
  if (now - lastPredictAt < 1500) return;
  lastPredictAt = now;

  try {
    console.log("[watch] runPredict payload", {
      userId,
      hr: Number(data.hr ?? 0),
      hrv: Number(data.hrv ?? 0),
      sleepHours: Number(data.sleepHours ?? 0),
      steps: Number(data.steps ?? 0),
      stressPercent: Number(data.stressPercent ?? lastLive?.stressPercent ?? 0),
    });

    const res = await apiPredict({
      userId,
      dateTimeISO: getLocalDateTimeISO(),
      HR_sensor: Number(data.hr ?? 0),
      Heart_Rate_Variability: Number(data.hrv ?? 0),
      Sleep_Hours: Number(data.sleepHours ?? 0),
      steps_sensor: Number(data.steps ?? 0),
      stressPercent: Number(data.stressPercent ?? lastLive?.stressPercent ?? 0),
    });

    console.log("[watch] runPredict response", res);

    const existingHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);
    const hasStressChangeAlert = !!res.alert?.message;
    const mergedHistory =
      hasStressChangeAlert && res.activitySuggested
        ? mergeRecommendationHistory(
            buildRecoFromPredict({
              activitySuggested: res.activitySuggested,
              activityDescription: res.activityDescription,
              activityDurationMin: res.activityDurationMin,
              category: res.category,
              supportMessage: res.supportMessage,
            }),
            existingHistory
          )
        : existingHistory;

    if (hasStressChangeAlert && res.activitySuggested) {
      activitiesBadgeDismissed = false;
    }

    const stableStressPercent = clampStressPercent(
      Number(data.stressPercent ?? lastLive?.stressPercent ?? 0)
    );

    lastLive = {
      ...(lastLive || {}),
      hr: Number(data.hr ?? 0),
      hrv: Number(data.hrv ?? 0),
      sleepHours: Number(data.sleepHours ?? 0),
      steps: Number(data.steps ?? 0),
      stressPercent: stableStressPercent,
      stressLevel:
        res.currentStressLevel === "Low" ||
        res.currentStressLevel === "Medium" ||
        res.currentStressLevel === "High"
          ? (res.currentStressLevel as StressLevel)
          : lastLive?.stressLevel ?? "Low",
      modelReady: true,
      recommendation: mergedHistory[0] ?? lastLive?.recommendation,
      recommendationHistory: mergedHistory,
      alertsCount: Number(res.unreadCount ?? lastLive?.alertsCount ?? 0),
      activitiesCount: activitiesBadgeDismissed ? 0 : countUnreadRecommendations(mergedHistory),
      supportMessage: hasStressChangeAlert
        ? res.supportMessage ?? ""
        : lastLive?.supportMessage ?? "",
      stressChangeMessage: res.alert?.message ?? lastLive?.stressChangeMessage ?? "",
      latestAlertCreatedAt: hasStressChangeAlert
        ? getLocalDateTimeISO()
        : lastLive?.latestAlertCreatedAt ?? "",
      timestamp: getLocalDateISO(),
    };

    emit();
    await persistRecommendationHistory(userId, mergedHistory);
    await syncUnreadCount(userId, true);
  } catch (e) {
    console.log("runPredict error:", e);

    const recommendationHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);
    const stableStressPercent = clampStressPercent(
      Number(data.stressPercent ?? lastLive?.stressPercent ?? 0)
    );

    lastLive = {
      ...(lastLive || {}),
      hr: Number(data.hr ?? 0),
      hrv: Number(data.hrv ?? 0),
      sleepHours: Number(data.sleepHours ?? 0),
      steps: Number(data.steps ?? 0),
      stressPercent: stableStressPercent,
      stressLevel: lastLive?.stressLevel ?? "Low",
      modelReady: true,
      recommendationHistory,
      recommendation: recommendationHistory[0] ?? lastLive?.recommendation,
      activitiesCount: activitiesBadgeDismissed ? 0 : countUnreadRecommendations(recommendationHistory),
      timestamp: getLocalDateISO(),
    };
    emit();
    await persistRecommendationHistory(userId, recommendationHistory);
  }
}

export async function getTodayFromWatchOrBackend(userId: string): Promise<TodayData> {
  if (!userId) {
    resetLiveState();
    return {
      hr: 0,
      hrv: 0,
      sleepHours: 0,
      steps: 0,
      stressPercent: 0,
      stressLevel: "Low",
      modelReady: false,
      timestamp: getLocalDateISO(),
      alertsCount: 0,
      activitiesCount: 0,
      recommendation: undefined,
      recommendationHistory: [],
      supportMessage: "",
      stressChangeMessage: "",
      latestAlertCreatedAt: "",
    };
  }

  if (currentLiveUserId && currentLiveUserId !== userId) {
    resetLiveState();
  }

  currentLiveUserId = userId;

  if (online && lastLive && currentLiveUserId === userId) {
    return lastLive;
  }

  const [persistedRecommendationHistory, activitySeenAt] = await Promise.all([
    loadPersistedRecommendationHistory(userId),
    loadActivitySeenAt(userId),
  ]);

  try {
    const [weekly, alerts, activitiesRes] = await Promise.all([
      apiWeeklyReport({ userId, days: 1 }),
      apiAlertsList({ userId, limit: 1 }),
      apiActivitiesList({ userId, limit: 50 }).catch(() => null),
    ]);

    const p = weekly.points?.[0];
    const unreadCount = Number(alerts?.unreadCount ?? 0);
    const latestAlert = alerts?.alerts?.[0];
    const backendActivities = Array.isArray(activitiesRes?.activities) ? activitiesRes.activities : [];

    if (p) {
      const hr = Number(p.HR ?? 0);
      const hrv = Number(p.HRV ?? 0);
      const sleepHours = Number(p.SleepHours ?? 0);
      const steps = Number(p.Steps ?? 0);

      const rawLevel = (p.StressLevel || "Unknown").toString();
      const backendLevel =
        rawLevel === "Low" || rawLevel === "Medium" || rawLevel === "High"
          ? (rawLevel as StressLevel)
          : "Low";

      const backendStressPercent =
        backendLevel === "High" ? 85 : backendLevel === "Medium" ? 55 : 20;

      const hasRealDailyData = hr > 0 || hrv > 0 || sleepHours > 0 || steps > 0;
      const recommendationHistory = normalizeHistory(
        lastLive?.recommendationHistory?.length
          ? lastLive.recommendationHistory
          : hasRealDailyData || backendActivities.length
          ? persistedRecommendationHistory
          : []
      );
      const activitiesCount = activitiesBadgeDismissed
        ? 0
        : Math.max(
            countUnreadRecommendations(recommendationHistory),
            countUnseenBackendActivities(backendActivities, activitySeenAt)
          );

      const baseData: TodayData = {
        hr,
        hrv,
        sleepHours,
        steps,
        stressLevel: backendLevel,
        stressPercent: backendStressPercent,
        modelReady: hasRealDailyData,
        timestamp: p.dateISO || getLocalDateISO(),
        alertsCount: unreadCount,
        activitiesCount,
        recommendation: recommendationHistory[0] ?? lastLive?.recommendation,
        recommendationHistory,
        supportMessage: lastLive?.supportMessage ?? "",
        stressChangeMessage: latestAlert?.message ?? "",
        latestAlertCreatedAt: latestAlert?.createdAt ?? "",
      };

      lastLive = {
        ...(lastLive || {}),
        ...baseData,
      };
      currentLiveUserId = userId;

      return lastLive;
    }

    const recommendationHistory = normalizeHistory(
      lastLive?.recommendationHistory?.length
        ? lastLive.recommendationHistory
        : backendActivities.length
        ? persistedRecommendationHistory
        : []
    );

    return {
      hr: 0,
      hrv: 0,
      sleepHours: 0,
      steps: 0,
      stressPercent: 0,
      stressLevel: "Low",
      modelReady: false,
      timestamp: getLocalDateISO(),
      alertsCount: unreadCount,
      activitiesCount: activitiesBadgeDismissed
        ? 0
        : Math.max(
            countUnreadRecommendations(recommendationHistory),
            countUnseenBackendActivities(backendActivities, activitySeenAt)
          ),
      recommendation: recommendationHistory[0],
      recommendationHistory,
      supportMessage: lastLive?.supportMessage ?? "",
      stressChangeMessage: latestAlert?.message ?? "",
      latestAlertCreatedAt: latestAlert?.createdAt ?? "",
    };
  } catch (e) {
    console.log("getTodayFromWatchOrBackend fallback error:", e);
  }

  const recommendationHistory = normalizeHistory(lastLive?.recommendationHistory ?? []);

  return {
    hr: 0,
    hrv: 0,
    sleepHours: 0,
    steps: 0,
    stressPercent: 0,
    stressLevel: "Low" as StressLevel,
    modelReady: false,
    timestamp: getLocalDateISO(),
    alertsCount: 0,
    activitiesCount: 0,
    recommendation: recommendationHistory[0],
    recommendationHistory,
    supportMessage: "",
    stressChangeMessage: "",
    latestAlertCreatedAt: "",
  };
}

export async function startWatchLive(userId: string) {
  if (!isWeb()) throw new Error("BLE works only on WEB (Chrome/Edge).");
  if (!navigator.bluetooth) throw new Error("Web Bluetooth not supported in this browser.");

  if (currentLiveUserId && currentLiveUserId !== userId) {
    await resetWatchUserSession({ disconnect: true });
  }

  if (device?.gatt?.connected) {
    currentLiveUserId = userId;
    online = true;
    emit();
    return;
  }

  device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
  });

  device.addEventListener("gattserverdisconnected", () => {
    online = false;
    emit();
  });

  server = await device.gatt!.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  notifyChar = await service.getCharacteristic(NOTIFY_CHAR_UUID);

  await notifyChar.startNotifications();

  notifyChar.addEventListener("characteristicvaluechanged", (ev: any) => {
    const v: DataView = ev.target.value;
    const text = new TextDecoder().decode(v.buffer);
    onIncomingText(text, userId);
  });

  currentLiveUserId = userId;
  online = true;
  emit();
}

export function stopWatchLive() {
  try {
    notifyChar?.stopNotifications?.();
  } catch {}
  try {
    server?.disconnect?.();
  } catch {}

  notifyChar = null;
  server = null;
  device = null;

  online = false;
  resetLiveState();
  emit();
}

function onIncomingText(chunk: string, userId: string) {
  buf += chunk;

  while (true) {
    const idx = buf.indexOf("\n");
    if (idx === -1) break;

    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;

    try {
      const obj = JSON.parse(line);
      const data = normalizeWatchObj(obj);

      lastLive = {
        ...(lastLive || {}),
        ...data,
      };

      online = true;
      emit();

      runPredict(userId, data);
    } catch (e) {
      console.log("watch parse error:", e);
    }
  }
}
