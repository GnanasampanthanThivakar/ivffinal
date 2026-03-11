import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiAlertsList, apiAlertsMarkRead } from "../services/backendApi";
import { setLiveUnreadCount } from "../services/watchData";

type Level = "Low" | "Medium" | "High";

type UiAlertItem = {
  id: number | string;
  title: string;
  message: string;
  level: Level;
  timeLabel: string;
  dayGroup: "Today" | "Yesterday" | "Earlier";
  isNew: boolean;
};

function toLevel(fromLevel?: string | null, toLevel?: string | null): Level {
  const s = (toLevel || fromLevel || "").toLowerCase();
  if (s.includes("high")) return "High";
  if (s.includes("medium")) return "Medium";
  return "Low";
}

function formatTimeLabel(createdAt: any): string {
  try {
    if (!createdAt) return "";

    // sqlite string usually: "2026-03-07 13:53:21"
    const normalized =
      typeof createdAt === "string" && createdAt.includes(" ")
        ? createdAt.replace(" ", "T")
        : createdAt;

    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return "";

    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function dayGroupFromDateISO(dateISO?: string): "Today" | "Yesterday" | "Earlier" {
  if (!dateISO) return "Earlier";

  const d = new Date(dateISO + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const y = new Date(today);
  y.setDate(y.getDate() - 1);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === y.getTime()) return "Yesterday";
  return "Earlier";
}

function buildTitle(fromLevel?: string | null, toLevel?: string | null): string {
  const fromS = (fromLevel || "").toLowerCase();
  const toS = (toLevel || "").toLowerCase();

  if ((fromS === "low" || fromS === "medium") && toS === "high") return "Stress increased";
  if (fromS === "high" && (toS === "medium" || toS === "low")) return "Stress easing";
  return "Stress changed";
}

function normalizeFromBackend(a: any): UiAlertItem {
  const level = toLevel(a?.fromLevel, a?.toLevel);

  return {
    id: a?.id ?? Math.random().toString(),
    title: buildTitle(a?.fromLevel, a?.toLevel),
    message: String(a?.message ?? ""),
    level,
    timeLabel: formatTimeLabel(a?.createdAt),
    dayGroup: dayGroupFromDateISO(a?.dateISO),
    isNew: !Boolean(a?.isRead),
  };
}

export default function AlertScreen() {
  const userId = "user_1";

  const [alerts, setAlerts] = useState<UiAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await apiAlertsList({ userId, limit: 50 });
      const list = (res?.alerts ?? []).map(normalizeFromBackend);
      setAlerts(list);

      // immediately mark read after fetch
      await apiAlertsMarkRead({ userId });

      // update local/home badge instantly
      setLiveUnreadCount(0);

      // update local UI instantly
      setAlerts((prev) => prev.map((x) => ({ ...x, isNew: false })));
    } catch (e) {
      console.log(e);
      setErrorMsg("Failed to load alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const today = alerts.filter((a) => a.dayGroup === "Today");
    const yesterday = alerts.filter((a) => a.dayGroup === "Yesterday");
    const earlier = alerts.filter((a) => a.dayGroup === "Earlier");
    return { today, yesterday, earlier };
  }, [alerts]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Supportive check-ins & notifications</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading alerts...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Text style={{ fontWeight: "800", marginBottom: 8 }}>{errorMsg}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Section title="Today" items={grouped.today} />
          <Section title="Yesterday" items={grouped.yesterday} />
          <Section title="Earlier" items={grouped.earlier} />

          {alerts.length === 0 ? (
            <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
              <Text style={{ color: "#64748B", fontWeight: "800" }}>
                No alerts available right now.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section(props: { title: string; items: UiAlertItem[] }) {
  if (!props.items || props.items.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
      <Text style={styles.sectionTitle}>{props.title}</Text>

      {props.items.map((a) => (
        <View key={String(a.id)} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.time}>{a.timeLabel}</Text>
          </View>

          <Text style={styles.msg}>{a.message}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, badgeColor(a.level)]}>
              <Text style={styles.badgeText}>{a.level}</Text>
            </View>
            {a.isNew ? <Text style={styles.newText}>NEW</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function badgeColor(level: Level) {
  if (level === "High") return { backgroundColor: "#FEE2E2" };
  if (level === "Medium") return { backgroundColor: "#FEF3C7" };
  return { backgroundColor: "#DCFCE7" };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FBFC" },

  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: "#111827" },
  subtitle: { marginTop: 4, color: "#64748B", fontFamily: 'PlusJakartaSans_500Medium' },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },

  sectionTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: "#111827", marginBottom: 10 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', color: "#111827" },
  time: { color: "#94A3B8", fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },

  msg: { marginTop: 8, color: "#475569", fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 18 },

  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold', color: "#111827" },
  newText: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold', color: "#E11D48" },
});