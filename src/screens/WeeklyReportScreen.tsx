import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Svg, { Polyline, Line, Circle } from "react-native-svg";

import { apiWeeklyReport, WeeklyReportPoint } from "../services/backendApi";
import { auth } from "../services/firebase";
import { subscribeWatchLive } from "../services/watchData";

type MetricCardProps = {
  title: string;
  unit: string;
  avgText: string;
  avgValue: number;
  labels: string[];
  values: number[];
  advice: string;
  lineColor: string;
  pillBg: string;
};

const CHART_W = 300;
const CHART_H = 110;
const PAD_X = 10;
const PAD_Y = 10;

function buildPolylinePoints(values: number[]) {
  const safeValues = values.length ? values : [0];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);

  return safeValues
    .map((v, i) => {
      const x =
        PAD_X +
        (i * (CHART_W - PAD_X * 2)) / Math.max(safeValues.length - 1, 1);
      const y =
        CHART_H -
        PAD_Y -
        ((v - min) / range) * (CHART_H - PAD_Y * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function GraphCard({
  title,
  unit,
  avgText,
  avgValue,
  labels,
  values,
  advice,
  lineColor,
  pillBg,
}: MetricCardProps) {
  const points = useMemo(() => buildPolylinePoints(values), [values]);

  const safeValues = values.length ? values : [0];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);
  const avgY =
    CHART_H -
    PAD_Y -
    ((avgValue - min) / range) * (CHART_H - PAD_Y * 2);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconCircle, { backgroundColor: pillBg }]}>
          <Text style={styles.metricIconText}>{title[0]}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.metricTitle}>{title}</Text>
          <View style={styles.metricAvgRow}>
            <Text style={styles.metricAvg}>{avgText}</Text>
            <Text style={styles.metricUnit}>avg {unit}</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <Svg width={CHART_W} height={CHART_H}>
          <Line
            x1={PAD_X}
            y1={CHART_H - PAD_Y}
            x2={CHART_W - PAD_X}
            y2={CHART_H - PAD_Y}
            stroke="#D6DEE6"
            strokeWidth="1"
          />

          <Line
            x1={PAD_X}
            y1={avgY}
            x2={CHART_W - PAD_X}
            y2={avgY}
            stroke={lineColor}
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          <Polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {safeValues.map((v, i) => {
            const x =
              PAD_X +
              (i * (CHART_W - PAD_X * 2)) / Math.max(safeValues.length - 1, 1);
            const y =
              CHART_H -
              PAD_Y -
              ((v - min) / range) * (CHART_H - PAD_Y * 2);

            return (
              <Circle
                key={`${title}_${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill={lineColor}
              />
            );
          })}
        </Svg>

        <View style={styles.labelRow}>
          {labels.map((l, i) => (
            <Text key={`${title}_lbl_${i}`} style={styles.dayLabel}>
              {l}
            </Text>
          ))}
        </View>

        <Text style={styles.avgGuideText}>Dashed line shows 7-day average</Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>{advice}</Text>
      </View>
    </View>
  );
}

function stressToValue(s: string) {
  const x = (s || "").toLowerCase();
  if (x === "low") return 1;
  if (x === "medium") return 2;
  if (x === "high") return 3;
  return 0;
}

function avg(nums: number[]) {
  const valid = nums.filter((n) => Number(n) > 0);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function shortDay(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function WeeklyReportScreen() {
  const navigation = useNavigation<any>();
  const userId = auth?.currentUser?.uid || "";

  const [points, setPoints] = useState<WeeklyReportPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const liveRefreshAtRef = useRef(0);

  const load = useCallback(async (silent?: boolean) => {
    if (!userId) {
      setPoints([]);
      setErrorMsg("Please log in to view weekly data");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setErrorMsg(null);
      const res = await apiWeeklyReport({ userId, days: 7 });
      setPoints(res.points ?? []);
    } catch (e) {
      console.log(e);
      setErrorMsg("Failed to load weekly report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load(false);
      return undefined;
    }, [load])
  );

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeWatchLive(async () => {
      const now = Date.now();
      if (now - liveRefreshAtRef.current < 3000) return;
      liveRefreshAtRef.current = now;

      try {
        await load(true);
      } catch (e) {
        console.log("weekly live refresh error:", e);
      }
    });

    return  () => { unsub(); };
  }, [load, userId]);

  const labels = useMemo(() => points.map((p) => shortDay(p.dateISO)), [points]);
  const hrValues = useMemo(() => points.map((p) => Number(p.HR ?? 0)), [points]);
  const hrvValues = useMemo(() => points.map((p) => Number(p.HRV ?? 0)), [points]);
  const sleepValues = useMemo(() => points.map((p) => Number(p.SleepHours ?? 0)), [points]);
  const stepsValues = useMemo(() => points.map((p) => Number(p.Steps ?? 0)), [points]);
  const stressValues = useMemo(() => points.map((p) => stressToValue(p.StressLevel)), [points]);
  const avgHr = useMemo(() => Math.round(avg(hrValues)) || 0, [hrValues]);
  const avgHrv = useMemo(() => Math.round(avg(hrvValues)) || 0, [hrvValues]);
  const avgSleep = useMemo(() => avg(sleepValues).toFixed(1), [sleepValues]);
  const avgSteps = useMemo(() => Math.round(avg(stepsValues)) || 0, [stepsValues]);

  const hasAnyRealData = useMemo(() => {
    return points.some((p) => {
      return (
        Number(p.HR ?? 0) > 0 ||
        Number(p.HRV ?? 0) > 0 ||
        Number(p.SleepHours ?? 0) > 0 ||
        Number(p.Steps ?? 0) > 0
      );
    });
  }, [points]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading weekly report...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: "800" }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
      }
    >
      <View style={styles.hero}>
        <LinearGradient
          colors={["#146F6B", "#178E88", "#167A75"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradientBg}
        />
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{"← Back"}</Text>
        </TouchableOpacity>

        <Text style={styles.heroTitle}>Weekly Report</Text>
        <Text style={styles.heroSub}>Your wellness trends for the past 7 days</Text>
      </View>

      {!hasAnyRealData ? (
        <View style={styles.emptyCard}>
          <Text style={{ color: "#64748B", fontWeight: "800" }}>
            No real weekly data yet. Connect the watch and wait for valid HR and HRV sync.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.avgGrid}>
            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>Avg HR</Text>
              <Text style={styles.avgValue}>{avgHr}</Text>
              <Text style={styles.avgUnit}>bpm</Text>
            </View>

            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>Avg HRV</Text>
              <Text style={styles.avgValue}>{avgHrv}</Text>
              <Text style={styles.avgUnit}>ms</Text>
            </View>

            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>Avg Sleep</Text>
              <Text style={styles.avgValue}>{avgSleep}</Text>
              <Text style={styles.avgUnit}>hrs</Text>
            </View>

            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>Avg Steps</Text>
              <Text style={styles.avgValue}>{avgSteps}</Text>
              <Text style={styles.avgUnit}>steps</Text>
            </View>
          </View>

          <GraphCard
            title="Heart Rate"
            unit="bpm"
            avgText={`${avgHr}`}
            avgValue={avgHr}
            labels={labels}
            values={hrValues}
            advice="If HR rises or falls, the graph will update automatically from new backend data."
            lineColor="#F27C6B"
            pillBg="#FDE9E6"
          />

          <GraphCard
            title="Heart Rate Variability"
            unit="ms"
            avgText={`${avgHrv}`}
            avgValue={avgHrv}
            labels={labels}
            values={hrvValues}
            advice="HRV trends should move up or down as new synced values are stored."
            lineColor="#53B7B3"
            pillBg="#E2F5F4"
          />

          <GraphCard
            title="Sleep Duration"
            unit="hrs"
            avgText={`${avgSleep}`}
            avgValue={Number(avgSleep)}
            labels={labels}
            values={sleepValues}
            advice="Sleep changes will appear as trend shifts day by day."
            lineColor="#7A8DF5"
            pillBg="#E9EDFF"
          />

          <GraphCard
            title="Step Count"
            unit="steps"
            avgText={`${avgSteps}`}
            avgValue={avgSteps}
            labels={labels}
            values={stepsValues}
            advice="Step movement will be visible when the stored daily values change."
            lineColor="#6EBB76"
            pillBg="#E7F6E8"
          />

          <GraphCard
            title="Stress Level"
            unit="level"
            avgText={`${avg(stressValues).toFixed(1)}`}
            avgValue={avg(stressValues)}
            labels={labels}
            values={stressValues}
            advice="Stress trend changes only when valid stress predictions are saved by day."
            lineColor="#C47AE8"
            pillBg="#F2E8FB"
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7F9",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  hero: {
    backgroundColor: "#178E88",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    position: "relative",
  },

  heroGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 18,
  },

  backBtn: {
    alignSelf: "flex-start",
  },

  heroTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: "#FFFFFF",
  },

  heroSub: {
    marginTop: 8,
    fontSize: 16,
    color: "#EAF7F6",
    fontFamily: "PlusJakartaSans_500Medium",
  },

  emptyCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
  },

  avgGrid: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  avgCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  avgLabel: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: "PlusJakartaSans_700Bold",
  },

  avgValue: {
    marginTop: 8,
    fontSize: 24,
    color: "#111827",
    fontFamily: "PlusJakartaSans_800ExtraBold",
  },

  avgUnit: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },

  metricCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  metricIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  metricIconText: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: "#213547",
  },

  metricTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#2B3C4D",
  },

  metricAvgRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },

  metricAvg: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: "#111827",
    marginRight: 6,
  },

  metricUnit: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "PlusJakartaSans_500Medium",
  },

  labelRow: {
    width: CHART_W,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },

  dayLabel: {
    fontSize: 12,
    color: "#7A8793",
    fontFamily: "PlusJakartaSans_500Medium",
  },

  avgGuideText: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748B",
    fontFamily: "PlusJakartaSans_500Medium",
  },

  tipBox: {
    marginTop: 16,
    backgroundColor: "#F8EAEA",
    borderRadius: 16,
    padding: 14,
  },

  tipText: {
    color: "#5C4A4A",
    fontSize: 14,
    lineHeight: 23,
    fontFamily: "PlusJakartaSans_500Medium",
  },
});
