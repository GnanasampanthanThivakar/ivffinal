import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Polyline, Line, Circle } from "react-native-svg";

import { apiWeeklyReport, WeeklyReportPoint } from "../services/backendApi";

type MetricCardProps = {
  title: string;
  unit: string;
  avgText: string;
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
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function shortDay(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function WeeklyReportScreen() {
  const userId = "user_1";

  const [points, setPoints] = useState<WeeklyReportPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await apiWeeklyReport({ userId, days: 7 });
        setPoints(res.points ?? []);
      } catch (e) {
        console.log(e);
        setErrorMsg("Failed to load weekly report");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const labels = useMemo(
    () => points.map((p) => shortDay(p.dateISO)),
    [points]
  );

  const hrValues = useMemo(() => points.map((p) => Number(p.HR ?? 0)), [points]);
  const hrvValues = useMemo(() => points.map((p) => Number(p.HRV ?? 0)), [points]);
  const sleepValues = useMemo(() => points.map((p) => Number(p.SleepHours ?? 0)), [points]);
  const stepsValues = useMemo(() => points.map((p) => Number(p.Steps ?? 0)), [points]);
  const stressValues = useMemo(
    () => points.map((p) => stressToValue(p.StressLevel)),
    [points]
  );

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
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Weekly Report</Text>
        <Text style={styles.heroSub}>Your wellness trends for the past 7 days</Text>
      </View>

      {points.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ color: "#64748B", fontWeight: "800" }}>
            No weekly data yet. Watch connect பண்ணி சில நேரம் wait பண்ணுங்க.
          </Text>
        </View>
      ) : (
        <>
          <GraphCard
            title="Heart Rate"
            unit="bpm"
            avgText={`${Math.round(avg(hrValues))}`}
            labels={labels}
            values={hrValues}
            advice="Higher HR may indicate stress or hormonal changes. Stay hydrated and practice deep breathing."
            lineColor="#F27C6B"
            pillBg="#FDE9E6"
          />

          <GraphCard
            title="Heart Rate Variability"
            unit="ms"
            avgText={`${Math.round(avg(hrvValues))}`}
            labels={labels}
            values={hrvValues}
            advice="Good HRV supports resilience. Consistent sleep and relaxation can help improve it."
            lineColor="#53B7B3"
            pillBg="#E2F5F4"
          />

          <GraphCard
            title="Sleep Duration"
            unit="hrs"
            avgText={`${avg(sleepValues).toFixed(1)}`}
            labels={labels}
            values={sleepValues}
            advice="Adequate sleep is important for recovery and emotional balance. Aim for a regular sleep routine."
            lineColor="#7A8DF5"
            pillBg="#E9EDFF"
          />

          <GraphCard
            title="Step Count"
            unit="steps"
            avgText={`${Math.round(avg(stepsValues))}`}
            labels={labels}
            values={stepsValues}
            advice="Light daily movement supports circulation and well-being. Gentle walking is enough."
            lineColor="#6EBB76"
            pillBg="#E7F6E8"
          />

          <GraphCard
            title="Stress Level"
            unit="level"
            avgText={`${avg(stressValues).toFixed(1)}`}
            labels={labels}
            values={stressValues}
            advice="Watch for repeated stress spikes. Use your recommendations and supportive alerts to regulate gently."
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
    backgroundColor: "#44A6A3",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  heroSub: {
    marginTop: 8,
    fontSize: 16,
    color: "#EAF7F6",
    fontWeight: "600",
  },

  emptyCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
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
    fontWeight: "800",
    color: "#213547",
  },

  metricTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B3C4D",
  },

  metricAvgRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },

  metricAvg: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginRight: 6,
  },

  metricUnit: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
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
    fontWeight: "600",
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
    fontWeight: "600",
  },
});