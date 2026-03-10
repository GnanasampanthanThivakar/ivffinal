import type { TodayData, StressLevel } from "./firestoreService";
import { saveVitalSample, fetchLatestVitalsForUser } from "./firestoreService";
import { apiPredict } from "./backendApi";

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

type Listener = () => void;
const listeners = new Set<Listener>();

let buf = "";
let lastSaveAt = 0;
let lastPredictAt = 0;

function emit() {
  listeners.forEach((fn) => fn());
}

function parseStressLevel(p?: number): StressLevel {
  const x = Number(p ?? 0);
  if (x >= 70) return "High";
  if (x >= 35) return "Medium";
  return "Low";
}

function normalizeWatchObj(obj: any): TodayData {
  const hr = Number(obj.hr ?? obj.heartRate ?? 0);
  const hrv = Number(obj.hrv ?? 0);
  const sleepHours = Number(obj.sleepHours ?? obj.sleepHrs ?? 0);
  const steps = Number(obj.steps ?? 0);

  const stressPercent = Number(obj.stressPercent ?? obj.stress ?? 0);
  const stressLevel = (obj.stressLevel ?? parseStressLevel(stressPercent)) as StressLevel;

  return {
    hr,
    hrv,
    sleepHours,
    steps,
    stressPercent,
    stressLevel,
    timestamp: new Date().toISOString().slice(0, 10),
    alertsCount: lastLive?.alertsCount ?? 0,
  };
}

async function autoSave(userId: string, data: TodayData) {
  const now = Date.now();
  if (now - lastSaveAt < 2000) return;
  lastSaveAt = now;
  try {
    await saveVitalSample(userId, data);
  } catch {}
}

function buildRecoFromPredict(p: {
  activitySuggested: string;
  activityDescription?: string | null;
  activityDurationMin?: number | null;
}): TodayData["recommendation"] {
  return {
    title: p.activitySuggested || "Breathing Exercise",
    desc: p.activityDescription || "Try a gentle, supportive routine for a few minutes.",
    category: "Wellness",
    duration: p.activityDurationMin ? `${p.activityDurationMin} min` : "10 min",
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

export function setLiveUnreadCount(count: number) {
  if (!lastLive) {
    lastLive = {
      hr: 0,
      hrv: 0,
      sleepHours: 0,
      steps: 0,
      stressPercent: 0,
      stressLevel: "Low",
      timestamp: new Date().toISOString().slice(0, 10),
      alertsCount: count,
    };
  } else {
    lastLive = {
      ...lastLive,
      alertsCount: count,
    };
  }
  emit();
}

export async function getTodayFromWatchOrBackend(userId: string): Promise<TodayData> {
  if (online && lastLive) return lastLive;

  const fromDb = await fetchLatestVitalsForUser(userId);
  if (fromDb) {
    return {
      ...fromDb,
      alertsCount: fromDb.alertsCount ?? 0,
    };
  }

  return {
    hr: 0,
    hrv: 0,
    sleepHours: 0,
    steps: 0,
    stressPercent: 0,
    stressLevel: "Low",
    timestamp: new Date().toISOString().slice(0, 10),
    alertsCount: 0,
  };
}

export async function startWatchLive(userId: string) {
  if (!isWeb()) throw new Error("BLE works only on WEB (Chrome/Edge).");
  if (!navigator.bluetooth) throw new Error("Web Bluetooth not supported in this browser.");

  if (device?.gatt?.connected) {
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
  emit();
}

async function runPredict(userId: string, data: TodayData) {
  const now = Date.now();
  if (now - lastPredictAt < 1500) return;
  lastPredictAt = now;

  try {
    const res = await apiPredict({
      userId,
      dateTimeISO: new Date().toISOString(),
      HR_sensor: Number(data.hr ?? 0),
      Heart_Rate_Variability: Number(data.hrv ?? 0),
      Sleep_Hours: Number(data.sleepHours ?? 0),
      steps_sensor: Number(data.steps ?? 0),
    });

    const stress = (res.currentStressLevel || "Low") as StressLevel;

    lastLive = {
      ...(lastLive || data),
      ...data,
      stressLevel: stress === "Unknown" ? (data.stressLevel ?? "Low") : stress,
      recommendation: buildRecoFromPredict(res),
      alertsCount: Number(res.unreadCount ?? 0),
      timestamp: new Date().toISOString().slice(0, 10),
    };

    emit();
  } catch (e) {
    console.log("runPredict error:", e);
  }
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

      autoSave(userId, data);
      runPredict(userId, data);
    } catch {}
  }
}