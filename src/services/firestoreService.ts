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

export type StressLevel = "Low" | "Medium" | "High";

export type TodayData = {
  hr?: number;
  hrv?: number;
  sleepHours?: number;
  steps?: number;
  stressPercent?: number;
  stressLevel?: StressLevel;
  alertsCount?: number;
  activitiesCount?: number;
  recommendation?: {
    title: string;
    desc: string;
    category: "Mindfulness" | "Movement" | "Sleep" | "Wellness";
    duration: string;
  };
  timestamp?: string;
};

export type AlertItem = {
  id: string;
  dateISO: string;
  fromLevel?: StressLevel | null;
  toLevel?: StressLevel | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function toStressLevel(p?: number): StressLevel {
  const x = Number(p ?? 0);
  if (x >= 70) return "High";
  if (x >= 35) return "Medium";
  return "Low";
}

function safeNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function saveVitalSample(userId: string, data: TodayData) {
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
    alertsCount: 0,
    activitiesCount: 0,
  };
}

export async function fetchAlertsForUser(userId: string): Promise<AlertItem[]> {
  const q = query(
    collection(db, "alerts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      dateISO: x.dateISO || "",
      fromLevel: x.fromLevel || null,
      toLevel: x.toLevel || null,
      message: x.message || "",
      isRead: !!x.isRead,
      createdAt: x?.createdAt?.toDate ? x.createdAt.toDate().toISOString() : "",
    };
  });
}