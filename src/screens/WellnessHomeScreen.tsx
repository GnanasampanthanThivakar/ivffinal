import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";

import {
  getTodayFromWatchOrBackend,
  resetWatchUserSession,
  startWatchLive,
  stopWatchLive,
  subscribeWatchLive,
  isWatchOnline,
  syncUnreadCount,
} from "../services/watchData";
import { auth, firebaseReady } from "../services/firebase";
import { fetchUserProfile } from "../services/userProfileService";

import { useAppContext } from "../context/AppContext";

const COLORS = {
  teal: "#0F9F8F",
  tealMid: "#0B8F82",
  tealDark: "#08756B",
  tealSoft: "#E8F8F5",

  danger: "#B84A57",
  dangerDark: "#9F3D49",

  bg: "#F5F7F9",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#64748B",
};

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMetricValue(value: number, digits = 0) {
  const safe = Number(value ?? 0);
  return digits > 0 ? safe.toFixed(digits) : String(Math.round(safe));
}

function hasRealVitals(data: any) {
  return (
    Number(data?.hr ?? 0) > 0 ||
    Number(data?.hrv ?? 0) > 0 ||
    Number(data?.sleepHours ?? 0) > 0 ||
    Number(data?.steps ?? 0) > 0
  );
}

function hasValidStressDisplay(data: any) {
  return Number(data?.stressPercent ?? 0) >= 0 && !!data?.stressLevel;
}

function getStressColor(level: string) {
  if (level === "Low") return COLORS.teal;
  if (level === "Medium") return "#F5A623";
  return COLORS.danger;
}

function getDisplayStressLevel(percent: number) {
  if (percent < 35) return "Low";
  if (percent < 70) return "Medium";
  return "High";
}

const ZERO_TODAY = {
  hr: 0,
  hrv: 0,
  sleepHours: 0,
  steps: 0,
  stressPercent: 0,
  stressLevel: "Low",
  modelReady: false,
  alertsCount: 0,
  activitiesCount: 0,
  recommendation: undefined,
  recommendationHistory: [],
  supportMessage: "",
  stressChangeMessage: "",
  latestAlertCreatedAt: "",
};

export default function WellnessHomeScreen() {
  const navigation = useNavigation<any>();
  const userId = auth?.currentUser?.uid || "";
  const { setWellnessData } = useAppContext();

  const [today, setToday] = useState(ZERO_TODAY);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [lastSeenMs, setLastSeenMs] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [bleMsg, setBleMsg] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const modelReady = !!today.modelReady && hasValidStressDisplay(today);
  const stressPercent = clamp(Math.round(today.stressPercent ?? 0), 0, 100);
  const stressLevel = modelReady ? getDisplayStressLevel(stressPercent) : "Low";

  const alertsBadgeCount = Number(today.alertsCount ?? 0);
  const activitiesBadgeCount = Number(today.activitiesCount ?? 0);

  const stressColor = useMemo(() => getStressColor(stressLevel), [stressLevel]);

  function mapTodayData(data: any, watchConnected = false) {
    const history = Array.isArray(data?.recommendationHistory)
      ? data.recommendationHistory
      : [];

    const mapped = {
      ...ZERO_TODAY,
      ...(data || {}),
      hr: data?.hr ?? 0,
      hrv: data?.hrv ?? 0,
      sleepHours: data?.sleepHours ?? 0,
      steps: data?.steps ?? 0,
      stressPercent: data?.stressPercent ?? 0,
      stressLevel: data?.stressLevel ?? "Low",
      modelReady: !!data?.modelReady,
      alertsCount: Number(data?.alertsCount ?? 0),
      activitiesCount: Number(data?.activitiesCount ?? 0),
      recommendation: history[0] ?? data?.recommendation,
      recommendationHistory: history,
      supportMessage: data?.supportMessage ?? "",
      stressChangeMessage: data?.stressChangeMessage ?? "",
      latestAlertCreatedAt: data?.latestAlertCreatedAt ?? "",
      timestamp: data?.timestamp,
    };

    if (!hasRealVitals(mapped)) {
      mapped.stressPercent = 0;
      mapped.modelReady = false;
    }

    return mapped;
  }

  async function load() {
    if (!userId) {
      setToday(ZERO_TODAY);
      setOnline(false);
      setErrorMsg(null);
      setInitialLoading(false);
      return;
    }

    try {
      setInitialLoading(true);
      setErrorMsg(null);

      const data = await getTodayFromWatchOrBackend(userId);

      if (!mountedRef.current) return;

      const watchConnected = isWatchOnline();
      const mapped = mapTodayData(data, watchConnected);
      setToday(mapped);
      setOnline(watchConnected);
      setLastSeenMs(watchConnected && hasRealVitals(mapped) ? Date.now() : 0);

      // Store wellness data in shared context ONLY when real watch data exists
      if (mapped?.hr && mapped.hr > 0) {
        setWellnessData({
          stressLevel: mapped?.stressLevel ?? 'Low',
          hr: mapped?.hr ?? 0,
          hrv: mapped?.hrv ?? 0,
          sleep: mapped?.sleepHours ?? 0,
          steps: mapped?.steps ?? 0
        });
      }
    } catch (e) {
      console.log("LOAD ERROR:", e);
      if (!mountedRef.current) return;
      setErrorMsg("Failed to load wellness data");
    } finally {
      if (!mountedRef.current) return;
      setInitialLoading(false);
    }
  }

  async function loadProfile() {
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await fetchUserProfile(userId);
      if (!mountedRef.current) return;
      setProfile(nextProfile);
    } catch (e) {
      console.log("profile load error:", e);
    }
  }

  async function onConnectPress() {
    if (!userId) {
      setBleMsg("Please log in first.");
      return;
    }

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

      setBleMsg("Watch connected");
      setOnline(true);
      setLastSeenMs(Date.now());

      await load();
    } catch (e: any) {
      if (!mountedRef.current) return;
      setBleMsg(e?.message || "Failed to connect watch");
      setOnline(false);
    } finally {
      if (!mountedRef.current) return;
      setConnecting(false);
    }
  }

  async function onDisconnectPress() {
    stopWatchLive();
    setOnline(false);
    setBleMsg("Disconnected");
    setLastSeenMs(0);

    try {
      const latest = await getTodayFromWatchOrBackend(userId);
      if (!mountedRef.current) return;
      setToday(mapTodayData(latest, false));
    } catch (e) {
      console.log("disconnect refresh error:", e);

      if (!mountedRef.current) return;
      setToday((prev) => ({
        ...prev,
        hr: 0,
        hrv: 0,
        sleepHours: 0,
        steps: 0,
        stressPercent: 0,
        stressLevel: "Low",
        modelReady: false,
      }));
    }
  }

  async function onLogoutPress() {
    try {
      if (!firebaseReady || !auth) return;
      await resetWatchUserSession({
        disconnect: true,
        clearPersistedForUserId: userId,
      });
      await signOut(auth);
    } catch (e) {
      console.log("logout error:", e);
    }
  }

  function onProfilePress() {
    navigation.navigate("AccountProfile");
  }

  useEffect(() => {
    mountedRef.current = true;

    loadProfile();
    load();

    const unsub = subscribeWatchLive(async () => {
      if (!mountedRef.current) return;

      setLastSeenMs(Date.now());
      setOnline(isWatchOnline());

      try {
        const data = await getTodayFromWatchOrBackend(userId);
        if (!mountedRef.current) return;
        setToday(mapTodayData(data, isWatchOnline()));
      } catch (e) {
        console.log("LIVE UPDATE ERROR:", e);
      }
    });

    const t = setInterval(async () => {
      if (!mountedRef.current || !userId) return;

      const watchConnected = isWatchOnline();
      setOnline(watchConnected);

      try {
        if (!watchConnected) {
          const data = await getTodayFromWatchOrBackend(userId);
          if (!mountedRef.current) return;
          setToday(mapTodayData(data, false));
        } else {
          await syncUnreadCount(userId);
        }
      } catch {}
    }, 15000);

    return () => {
      mountedRef.current = false;
      unsub();
      clearInterval(t);
    };
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      load();
    }, [userId])
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: stressPercent,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [stressPercent, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  if (initialLoading) {
    return (
      <View style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.safeArea, styles.center, { padding: 20 }]}>
        <Text style={{ fontWeight: "600", marginBottom: 12 }}>{errorMsg}</Text>

        <View style={{ flexDirection: "row", marginBottom: 12, width: "100%" }}>
          <TouchableOpacity
            style={[styles.connectBtnWide, { opacity: connecting ? 0.7 : 1, marginRight: 10 }]}
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
          <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: "center" }}>{bleMsg}</Text>
        ) : null}

        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.teal, COLORS.tealMid, COLORS.tealDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradientBg}
        />

        <View style={{ height: 8 }} />

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View style={styles.summaryIconCircle}>
              <Image source={ICONS.wellness} style={styles.icon28} />
            </View>

            <Text style={styles.summaryTitle}>Wellness Summary</Text>

            <TouchableOpacity style={styles.profileBtn} onPress={onProfilePress} activeOpacity={0.85}>
              <Text style={styles.profileBtnText}>Profile</Text>
            </TouchableOpacity>

            {firebaseReady && auth ? (
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogoutPress} activeOpacity={0.85}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.connectBtnWide, { opacity: connecting ? 0.7 : 1, marginRight: 10 }]}
              onPress={onConnectPress}
              disabled={connecting}
              activeOpacity={0.85}
            >
              <Text style={styles.connectBtnText}>
                {connecting ? "Connecting..." : "Connect Watch (BLE)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnectPress} activeOpacity={0.85}>
              <Text style={styles.disconnectBtnText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {bleMsg ? (
            <Text style={{ marginTop: 8, fontSize: 12, color: COLORS.muted }}>{bleMsg}</Text>
          ) : null}

          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: "800",
              color: online ? COLORS.tealMid : COLORS.dangerDark,
            }}
          >
            {online ? "Watch Online" : "Watch Offline"}{" "}
            {lastSeenMs ? `(${new Date(lastSeenMs).toLocaleTimeString()})` : ""}
          </Text>

          <View style={styles.summaryStressTopRow}>
            <View style={styles.summaryStressRow}>
              <Text style={styles.summaryStressLabel}>Stress Level:</Text>

              <View
                style={[
                  styles.stressChip,
                  {
                    backgroundColor: stressColor + "18",
                    borderColor: stressColor,
                  },
                ]}
              >
                <Text style={[styles.stressChipText, { color: stressColor }]}>
                  {modelReady ? stressLevel : "Waiting"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.percentBox,
                { backgroundColor: stressColor + "12", borderColor: stressColor },
              ]}
            >
              <Text style={[styles.percentText, { color: stressColor }]}>
                {modelReady ? `${stressPercent}%` : "0%"}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: modelReady ? progressWidth : "0%",
                  backgroundColor: stressColor,
                },
              ]}
            />
          </View>

          <View style={styles.progressLabelsRow}>
            <Text style={styles.progressLabelText}>0%</Text>
            <Text style={styles.progressLabelText}>50%</Text>
            <Text style={styles.progressLabelText}>100%</Text>
          </View>
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

            {alertsBadgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertsBadgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { marginRight: 0 }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Activities")}
          >
            <View style={styles.quickIconCircle}>
              <Image source={ICONS.activity} style={styles.icon24} />
            </View>
            <Text style={styles.quickLabel}>Activities</Text>
            <Text style={styles.quickSubtitle}>Guided routines</Text>

            {activitiesBadgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activitiesBadgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { marginBottom: 60 }]}>
        <View style={styles.metricsHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Metrics</Text>

          <View
            style={[
              styles.metricsLivePill,
              { backgroundColor: online ? COLORS.tealSoft : "#F1F5F9" },
            ]}
          >
            <LiveDot active={online} />
            <Text
              style={[
                styles.metricsLivePillText,
                { color: online ? COLORS.tealMid : "#94A3B8" },
              ]}
            >
              {online ? "Live Sync" : "Latest Sync"}
            </Text>
          </View>
        </View>

        <MetricRow
          icon={ICONS.heart}
          label="Heart Rate"
          value={formatMetricValue(Number(today.hr ?? 0))}
          unit="bpm"
          online={online}
          accent={COLORS.danger}
          lastSeenMs={lastSeenMs}
        />

        <MetricRow
          icon={ICONS.hrv}
          label="Heart Rate Variability"
          value={formatMetricValue(Number(today.hrv ?? 0), 1)}
          unit="ms"
          online={online}
          accent="#F59E0B"
          lastSeenMs={lastSeenMs}
        />

        <MetricRow
          icon={ICONS.sleep}
          label="Sleep Duration"
          value={formatMetricValue(Number(today.sleepHours ?? 0), 1)}
          unit="hours"
          online={online}
          accent="#3B82F6"
          lastSeenMs={lastSeenMs}
        />

        <MetricRow
          icon={ICONS.steps}
          label="Step Count"
          value={formatMetricValue(Number(today.steps ?? 0))}
          unit="steps"
          online={online}
          accent={COLORS.teal}
          lastSeenMs={lastSeenMs}
        />
      </View>
    </ScrollView>
  );
}

function LiveDot({ active }: { active: boolean }) {
  const opacity = useRef(new Animated.Value(active ? 1 : 0.4)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0.4);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [active, opacity]);

  return (
    <Animated.View
      style={[
        styles.liveDot,
        {
          opacity,
          backgroundColor: active ? COLORS.teal : "#CBD5E1",
        },
      ]}
    />
  );
}

function MetricRow(props: any) {
  return (
    <View style={[styles.metricCard, { borderWidth: props.online ? 1 : 0, borderColor: props.accent }]}>
      <View style={styles.metricLeft}>
        <View style={styles.metricIconCircle}>
          <Image source={props.icon} style={styles.icon24} />
        </View>

        <View style={styles.metricTextContainer}>
          <View style={styles.metricTopRow}>
            <Text style={styles.metricLabel}>{props.label}</Text>

            <View
              style={[
                styles.metricBadge,
                { backgroundColor: props.online ? props.accent + "18" : "#F8FAFC" },
              ]}
            >
              <LiveDot active={props.online} />
              <Text
                style={[
                  styles.metricBadgeText,
                  { color: props.online ? props.accent : "#94A3B8" },
                ]}
              >
                {props.online ? "Live" : "Saved"}
              </Text>
            </View>
          </View>

          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{props.value}</Text>
            <Text style={styles.metricUnit}>{props.unit}</Text>
          </View>

          <Text style={styles.metricFootNote}>
            {props.online
              ? "Updating from connected watch"
              : props.lastSeenMs
              ? `Last synced at ${new Date(props.lastSeenMs).toLocaleTimeString()}`
              : "Waiting for watch data"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
  },

  headerGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },

  summaryCard: {
    marginTop: 10,
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#27364B",
    flex: 1,
  },

  connectBtnWide: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  connectBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },

  logoutBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  logoutBtnText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 12,
  },

  profileBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },

  profileBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  disconnectBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.dangerDark,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },

  disconnectBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  summaryStressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  summaryStressRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },

  summaryStressLabel: { fontSize: 14, color: COLORS.muted, marginRight: 8 },

  stressChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  stressChipText: { fontSize: 12, fontWeight: "600" },

  percentBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 74,
    alignItems: "center",
  },

  percentText: { fontSize: 18, fontWeight: "800" },

  progressTrack: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E6EEF0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressLabelsRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabelText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "600",
  },

  section: { paddingHorizontal: 20, marginTop: 18 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  quickRow: { flexDirection: "row", justifyContent: "space-between" },

  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  quickLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  quickSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  metricsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  metricsLivePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  metricsLivePillText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  metricCard: {
    backgroundColor: COLORS.card,
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

  metricLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  metricIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  metricTextContainer: { flex: 1 },

  metricTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metricLabel: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    paddingRight: 10,
  },

  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  metricBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },

  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    marginRight: 6,
  },

  metricUnit: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  metricFootNote: {
    marginTop: 5,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  retryBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },

  retryBtnText: { color: "#FFFFFF", fontWeight: "700" },

  icon28: { width: 28, height: 28, resizeMode: "contain" },
  icon24: { width: 24, height: 24, resizeMode: "contain" },
});
