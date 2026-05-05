import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  getTodayFromWatchOrBackend,
  startWatchLive,
  stopWatchLive,
  subscribeWatchLive,
  isWatchOnline,
} from "../services/watchData";

import type { TodayData } from "../services/firestoreService";
import { useAppContext } from "../context/AppContext";

type Nav = NativeStackNavigationProp<any, any>;

const ICONS = {
  wellness: require("../../assets/icons/wellness.png"),
  report: require("../../assets/icons/report.png"),
  alert: require("../../assets/icons/alert.png"),
  activity: require("../../assets/icons/activity.png"),
  heart: require("../../assets/icons/heart.png"),
  hrv: require("../../assets/icons/hrv.png"),
  sleep: require("../../assets/icons/sleep.png"),
  steps: require("../../assets/icons/steps.png"),
};

function isWeb() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export default function WellnessHomeScreen() {
  const navigation = useNavigation<Nav>();
  const userId = "user_1";
  const { setWellnessData } = useAppContext();

  const [today, setToday] = useState<TodayData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [online, setOnline] = useState(false);
  const [lastSeenMs, setLastSeenMs] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [bleMsg, setBleMsg] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const stressLevel = today?.stressLevel ?? "Low";

  const stressColor = useMemo(() => {
    return stressLevel === "Low"
      ? "#2BA89A"
      : stressLevel === "Medium"
      ? "#F5A623"
      : "#E05858";
  }, [stressLevel]);

  const stressDescription = useMemo(() => {
    return stressLevel === "Low"
      ? "Your body seems calm today. Keep following your gentle routine and take things slowly."
      : stressLevel === "Medium"
      ? "Your stress is a bit elevated. Try a short break or a calming activity."
      : "Your stress is high right now. Pause, breathe deeply, and follow one of the guided activities.";
  }, [stressLevel]);

  const todaysReco = today?.recommendation ?? null;
  const activitiesBadgeCount = todaysReco ? 1 : 0;

  async function load(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;

    try {
      if (!silent) setInitialLoading(true);
      else setRefreshing(true);

      setErrorMsg(null);

      const data = await getTodayFromWatchOrBackend(userId);

      if (!mountedRef.current) return;

      setToday({
        ...data,
        alertsCount: data?.alertsCount ?? 0,
        activitiesCount: data?.recommendation ? 1 : 0,
      });

      // Store wellness data in shared context ONLY when real watch data exists
      if (data?.hr && data.hr > 0) {
        setWellnessData({
          stressLevel: data?.stressLevel ?? 'Low',
          hr: data?.hr ?? 0,
          hrv: data?.hrv ?? 0,
          sleep: data?.sleepHours ?? 0,
          steps: data?.steps ?? 0
        });
      }

      setOnline(isWatchOnline());
      setLastSeenMs(Date.now());
    } catch (e) {
      console.log(e);
      if (!mountedRef.current) return;
      setErrorMsg("Failed to load wellness data");
      if (!silent) setToday(null);
    } finally {
      if (!mountedRef.current) return;
      if (!silent) setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [])
  );

  async function onConnectPress() {
    try {
      setBleMsg(null);
      setErrorMsg(null);

      if (!isWeb()) {
        setBleMsg("BLE works only on WEB (Chrome/Edge).");
        return;
      }

      setConnecting(true);
      await startWatchLive(userId);

      if (!mountedRef.current) return;

      setBleMsg("Watch connected ✅");
      setOnline(true);
      setLastSeenMs(Date.now());

      await load({ silent: true });
    } catch (e: any) {
      if (!mountedRef.current) return;
      setBleMsg(e?.message ?? "Failed to connect watch");
      setOnline(false);
    } finally {
      if (!mountedRef.current) return;
      setConnecting(false);
    }
  }

  function onDisconnectPress() {
    stopWatchLive();
    setOnline(false);
    setBleMsg("Disconnected");
  }

  useEffect(() => {
    mountedRef.current = true;

    load({ silent: false });

    const unsub = subscribeWatchLive(async () => {
      if (!mountedRef.current) return;

      setLastSeenMs(Date.now());
      setOnline(isWatchOnline());

      try {
        const data = await getTodayFromWatchOrBackend(userId);
        if (!mountedRef.current) return;

        setToday({
          ...data,
          alertsCount: data?.alertsCount ?? 0,
          activitiesCount: data?.recommendation ? 1 : 0,
        });
      } catch (e) {
        console.log(e);
      }
    });

    const t = setInterval(() => {
      if (!mountedRef.current) return;
      setOnline(isWatchOnline());
    }, 1000);

    return () => {
      mountedRef.current = false;
      unsub();
      clearInterval(t);
    };
  }, []);

  if (initialLoading) {
    return (
      <View style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (errorMsg || !today) {
    return (
      <View style={[styles.safeArea, styles.center, { padding: 20 }]}>
        <Text style={{ fontWeight: "600", marginBottom: 12 }}>
          {errorMsg ?? "No data"}
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12, width: "100%" }}>
          <TouchableOpacity
            style={[styles.connectBtnWide, { opacity: connecting ? 0.7 : 1 }]}
            onPress={onConnectPress}
            disabled={connecting}
          >
            <Text style={styles.connectBtnText}>
              {connecting ? "Connecting..." : "Connect Watch (BLE)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnectPress}>
            <Text style={styles.disconnectBtnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        {bleMsg ? (
          <Text style={{ fontSize: 12, color: "#64748B", textAlign: "center" }}>
            {bleMsg}
          </Text>
        ) : null}

        <TouchableOpacity style={styles.retryBtn} onPress={() => load({ silent: false })}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <View style={{ height: 8 }} />

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View style={styles.summaryIconCircle}>
              <Image source={ICONS.wellness} style={styles.icon28} />
            </View>
            <Text style={styles.summaryTitle}>Wellness Summary</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.connectBtnWide, { opacity: connecting ? 0.7 : 1 }]}
              onPress={onConnectPress}
              disabled={connecting}
              activeOpacity={0.85}
            >
              <Text style={styles.connectBtnText}>
                {connecting ? "Connecting..." : "Connect Watch (BLE)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={onDisconnectPress}
              activeOpacity={0.85}
            >
              <Text style={styles.disconnectBtnText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {bleMsg ? (
            <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B" }}>
              {bleMsg}
            </Text>
          ) : null}

          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: "800",
              color: online ? "#1E9A8A" : "#E05858",
            }}
          >
            {online ? "Watch Online ✅" : "Watch Offline ❌"}{" "}
            {lastSeenMs ? `(${new Date(lastSeenMs).toLocaleTimeString()})` : ""}
          </Text>

          <View style={styles.summaryStressRow}>
            <Text style={styles.summaryStressLabel}>Stress Level:</Text>
            <View
              style={[
                styles.stressChip,
                { backgroundColor: stressColor + "22", borderColor: stressColor },
              ]}
            >
              <Text style={[styles.stressChipText, { color: stressColor }]}>
                {stressLevel}
              </Text>
            </View>

            {refreshing ? (
              <ActivityIndicator size="small" style={{ marginLeft: 10 }} />
            ) : null}
          </View>

          <Text style={styles.summaryDescription}>{stressDescription}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("WeeklyReport")}
          >
            <View style={styles.quickIconCircle}>
              <Image source={ICONS.report} style={styles.icon24} />
            </View>
            <Text style={styles.quickLabel}>Weekly Report</Text>
            <Text style={styles.quickSubtitle}>View trends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Alerts")}
          >
            <View style={styles.quickIconCircle}>
              <Image source={ICONS.alert} style={styles.icon24} />
            </View>
            <Text style={styles.quickLabel}>Alerts</Text>
            <Text style={styles.quickSubtitle}>New notifications</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{today.alertsCount ?? 0}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Activities")}
          >
            <View style={styles.quickIconCircle}>
              <Image source={ICONS.activity} style={styles.icon24} />
            </View>
            <Text style={styles.quickLabel}>Activities</Text>
            <Text style={styles.quickSubtitle}>Guided routines</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activitiesBadgeCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { marginRight: 0 }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NutritionInput" as never)}
          >
            <View style={[styles.quickIconCircle, {backgroundColor: '#FFF3E0'}]}>
              <Text style={{fontSize: 20}}>🥗</Text>
            </View>
            <Text style={styles.quickLabel}>Nutrition</Text>
            <Text style={styles.quickSubtitle}>Setup Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Metrics</Text>

        <MetricRow icon={ICONS.heart} label="Heart Rate" value={`${Math.round(today.hr ?? 0)}`} unit="bpm" />
        <MetricRow icon={ICONS.hrv} label="Heart Rate Variability" value={`${Math.round(today.hrv ?? 0)}`} unit="ms" />
        <MetricRow icon={ICONS.sleep} label="Sleep Duration" value={`${(today.sleepHours ?? 0).toFixed(1)}`} unit="hours" />
        <MetricRow icon={ICONS.steps} label="Step Count" value={`${Math.round(today.steps ?? 0).toLocaleString()}`} unit="steps" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Recommendations</Text>

        <View style={styles.recoCard}>
          {todaysReco ? (
            <>
              <View style={styles.recoTopRow}>
                <View style={styles.recoIconCircle}>
                  <Image source={ICONS.activity} style={styles.icon24} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.recoTitleRow}>
                    <Text style={styles.recoTitle}>{todaysReco.title}</Text>
                    <View style={styles.recoDurationPill}>
                      <Text style={styles.recoDurationText}>{todaysReco.duration}</Text>
                    </View>
                  </View>

                  <Text style={styles.recoDesc}>{todaysReco.desc}</Text>
                  <Text style={styles.recoCategory}>{todaysReco.category}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Activities")}
                style={styles.recoCtaBtn}
              >
                <Text style={styles.recoCtaText}>Open Activities</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: "#64748B", fontWeight: "800" }}>
              No recommendation available right now.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function MetricRow(props: { icon: any; label: string; value: string; unit: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconCircle}>
        <Image source={props.icon} style={styles.icon24} />
      </View>

      <View style={styles.metricTextContainer}>
        <Text style={styles.metricLabel}>{props.label}</Text>
        <View style={styles.metricValueRow}>
          <Text style={styles.metricValue}>{props.value}</Text>
          <Text style={styles.metricUnit}>{props.unit}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7FBFC" },
  center: { justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#1E9A8A",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  summaryCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },

  summaryHeaderRow: { flexDirection: "row", alignItems: "center" },

  summaryIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E4F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#27364B", flex: 1 },

  connectBtnWide: {
    backgroundColor: "#1E9A8A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  disconnectBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  disconnectBtnText: { color: "#111827", fontWeight: "900", fontSize: 12 },

  summaryStressRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  summaryStressLabel: { fontSize: 14, color: "#64748B", marginRight: 8 },

  stressChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  stressChipText: { fontSize: 12, fontWeight: "600" },

  summaryDescription: { marginTop: 12, fontSize: 14, color: "#4B5563", lineHeight: 20 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },

  quickRow: { flexDirection: "row", justifyContent: "space-between" },

  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F3F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  quickLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  quickSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "#F97373",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  metricIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6F3F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  metricTextContainer: { flex: 1 },
  metricLabel: { fontSize: 14, color: "#4B5563" },

  metricValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  metricValue: { fontSize: 22, fontWeight: "700", color: "#111827", marginRight: 6 },
  metricUnit: { fontSize: 12, color: "#6B7280" },

  recoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },

  recoTopRow: { flexDirection: "row", alignItems: "flex-start" },

  recoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6F3F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },

  recoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  recoTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: "#111827" },
  recoDesc: { marginTop: 6, color: "#475569", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  recoCategory: { marginTop: 10, color: "#94A3B8", fontWeight: "800", fontSize: 12 },

  recoDurationPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recoDurationText: { color: "#111827", fontWeight: "900", fontSize: 12 },

  recoCtaBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#1E9A8A",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recoCtaText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },

  retryBtn: {
    backgroundColor: "#1E9A8A",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnText: { color: "#fff", fontWeight: "700" },

  icon28: { width: 28, height: 28, resizeMode: "contain" },
  icon24: { width: 24, height: 24, resizeMode: "contain" },
});