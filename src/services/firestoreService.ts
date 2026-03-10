// src/services/firestoreService.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ---------- TYPES ---------- */

export type StressLevel = "Low" | "Medium" | "High";

export type TodayData = {
  hr?: number;
  hrv?: number;
  sleepHours?: number;
  steps?: number;

  stressPercent?: number; // 0..100
  stressLevel?: StressLevel;

  // extra flags if you want
  alertsCount?: number;
  activitiesCount?: number;

  // optional recommendation
  recommendation?: {
    title: string;
    desc: string;
    category: "Mindfulness" | "Movement" | "Sleep" | "Wellness";
    duration: string;
  };

  // when stored
  timestamp?: string; // ISO date string (for display)
};

/* ---------- HELPERS ---------- */

function toStressLevel(p?: number): StressLevel {
  const x = Number(p ?? 0);
  if (x >= 70) return "High";
  if (x >= 35) return "Medium";
  return "Low";
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function safeNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------- WRITE ---------- */

export async function saveVitalSample(userId: string, data: TodayData) {
  // Store as a time-series in `vitals`
  await addDoc(collection(db, "vitals"), {
    userId,
    createdAt: Timestamp.now(),
    hr: safeNum(data.hr) ?? 0,
    hrv: safeNum(data.hrv) ?? 0,
    sleepHours: safeNum(data.sleepHours) ?? 0,
    steps: safeNum(data.steps) ?? 0,
    stressPercent: safeNum(data.stressPercent) ?? 0,
    stressLevel: (data.stressLevel ?? toStressLevel(data.stressPercent)) as StressLevel,
  });
}

/* ---------- READ (today/latest) ---------- */

export async function fetchLatestVitalsForUser(userId: string): Promise<TodayData | null> {
  const q = query(
    collection(db, "vitals"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0].data() as any;
  const createdAt: Date | null =
    doc?.createdAt?.toDate ? doc.createdAt.toDate() : null;

  const stressPercent = safeNum(doc.stressPercent) ?? 0;
  const stressLevel: StressLevel = (doc.stressLevel ?? toStressLevel(stressPercent)) as StressLevel;

  return {
    hr: safeNum(doc.hr) ?? 0,
    hrv: safeNum(doc.hrv) ?? 0,
    sleepHours: safeNum(doc.sleepHours) ?? 0,
    steps: safeNum(doc.steps) ?? 0,
    stressPercent,
    stressLevel,
    timestamp: createdAt ? createdAt.toISOString().slice(0, 10) : undefined,
    // keep counts optional (you can compute later)
    alertsCount: 0,
    activitiesCount: 0,
    recommendation: buildReco(stressLevel),
  };
}

/* ---------- WEEK SERIES (for WeeklyReportScreen) ---------- */

export type WeekSeries = {
  labels: string[]; // e.g. Mon..Sun
  hr: number[];
  hrv: number[];
  sleep: number[];
  steps: number[];
  stress: StressLevel[];
};

export async function fetchWeekSeriesFromVitals(userId: string): Promise<WeekSeries> {
  // pull last 7 records (or more) and map
  const q = query(
    collection(db, "vitals"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(7)
  );

  const snap = await getDocs(q);

  // sort ascending by date for chart consistency
  const rows = snap.docs
    .map((d) => d.data() as any)
    .map((r) => ({
      createdAt: r?.createdAt?.toDate ? r.createdAt.toDate() : new Date(),
      hr: safeNum(r.hr) ?? 0,
      hrv: safeNum(r.hrv) ?? 0,
      sleepHours: safeNum(r.sleepHours) ?? 0,
      steps: safeNum(r.steps) ?? 0,
      stressLevel: (r.stressLevel ?? toStressLevel(r.stressPercent)) as StressLevel,
    }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const labels = rows.map((r) =>
    r.createdAt.toLocaleDateString(undefined, { weekday: "short" })
  );

  return {
    labels,
    hr: rows.map((r) => r.hr),
    hrv: rows.map((r) => r.hrv),
    sleep: rows.map((r) => r.sleepHours),
    steps: rows.map((r) => r.steps),
    stress: rows.map((r) => r.stressLevel),
  };
}

/* ---------- SIMPLE RECO ---------- */

function buildReco(level: StressLevel) {
  if (level === "High") {
    return {
      title: "Box Breathing",
      desc: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat for 3–5 minutes.",
      category: "Mindfulness" as const,
      duration: "5 min",
    };
  }
  if (level === "Medium") {
    return {
      title: "Short Walk + Stretch",
      desc: "Walk slowly for 8 minutes and do light stretching.",
      category: "Movement" as const,
      duration: "10 min",
    };
  }
  return {
    title: "Maintain Routine",
    desc: "Keep hydration and do one gentle relaxation session.",
    category: "Wellness" as const,
    duration: "7 min",
  };
}
