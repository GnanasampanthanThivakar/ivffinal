import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  clearLiveActivitiesUnreadVisualOnly,
  getTodayFromWatchOrBackend,
  getStoredRecommendationHistory,
  markAllRecommendationsRead,
  subscribeWatchLive,
} from "../services/watchData";
import { apiActivitiesList } from "../services/backendApi";
import { auth } from "../services/firebase";

function categoryColor(category: string) {
  if (category === "Mindfulness") {
    return {
      iconBg: "#F3ECFF",
      iconText: "#A78BFA",
      badgeBg: "#F6F0FF",
      badgeText: "#8B5CF6",
    };
  }

  if (category === "Movement") {
    return {
      iconBg: "#FFF3EB",
      iconText: "#F59E0B",
      badgeBg: "#FFF7ED",
      badgeText: "#EA580C",
    };
  }

  if (category === "Sleep") {
    return {
      iconBg: "#EEF4FF",
      iconText: "#60A5FA",
      badgeBg: "#EFF6FF",
      badgeText: "#2563EB",
    };
  }

  return {
    iconBg: "#EAF8F5",
    iconText: "#14B8A6",
    badgeBg: "#F0FDFA",
    badgeText: "#0F766E",
  };
}

function categoryIcon(category: string) {
  if (category === "Mindfulness") return "*";
  if (category === "Movement") return "o";
  if (category === "Sleep") return "z";
  return "+";
}

function formatDateTime(value?: string) {
  if (!value) return "Date unavailable";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const date = d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} | ${time}`;
}

function toTs(value?: string) {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
}

function mapBackendActivity(item: any) {
  const durationMin = Number(item?.durationMin ?? 10);
  return {
    id: String(item?.id || `${item?.title || "activity"}_${item?.createdAt || Date.now()}`),
    title: item?.title || "Wellness Activity",
    desc: item?.description || "No description available.",
    category: item?.category || "Wellness",
    duration: `${durationMin} min`,
    durationMin,
    startLabel: "Now",
    supportMessage: item?.description || "",
    createdAt: item?.createdAt || "",
    isRead: true,
  };
}

function mergeAndSortActivities(...groups: any[][]) {
  const mergedMap = new Map<string, any>();

  for (const group of groups) {
    for (const item of group.filter(Boolean)) {
      const key = String(item?.id || `${item?.title || "activity"}_${item?.createdAt || ""}`);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, item);
      }
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => toTs(b?.createdAt) - toTs(a?.createdAt));
}

function hasAnyRealTodayData(today: any) {
  return (
    Number(today?.hr ?? 0) > 0 ||
    Number(today?.hrv ?? 0) > 0 ||
    Number(today?.sleepHours ?? 0) > 0 ||
    Number(today?.steps ?? 0) > 0 ||
    !!today?.modelReady
  );
}

export default function ActivityScreen() {
  const navigation = useNavigation<any>();
  const userId = auth?.currentUser?.uid || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const liveRefreshAtRef = useRef(0);

  async function load() {
    if (!userId) {
      setRecommendations([]);
      setErrorMsg("Please log in to view activity suggestions");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const [today, storedHistory, activitiesRes] = await Promise.all([
        getTodayFromWatchOrBackend(userId),
        getStoredRecommendationHistory(userId),
        apiActivitiesList({ userId, limit: 50 }).catch(() => null),
      ]);

      const liveHistory = Array.isArray(today?.recommendationHistory)
        ? [...today.recommendationHistory]
        : today?.recommendation
        ? [today.recommendation]
        : [];

      const backendHistory = Array.isArray(activitiesRes?.activities)
        ? activitiesRes.activities.map(mapBackendActivity)
        : [];

      const history =
        hasAnyRealTodayData(today) || backendHistory.length
          ? mergeAndSortActivities(liveHistory, backendHistory, storedHistory)
          : [];

      setRecommendations(history);

      if (!history.length) {
        setErrorMsg("No activity suggestions yet");
      }
    } catch (error) {
      console.log(error);
      setErrorMsg("Failed to load activity recommendation");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      clearLiveActivitiesUnreadVisualOnly();
      markAllRecommendationsRead();
      load();
    }, [userId])
  );

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeWatchLive(async () => {
      const now = Date.now();
      if (now - liveRefreshAtRef.current < 2000) return;
      liveRefreshAtRef.current = now;

      try {
        clearLiveActivitiesUnreadVisualOnly();
        markAllRecommendationsRead();
        await load();
      } catch (e) {
        console.log("activity live refresh error:", e);
      }
    });

    return unsub;
  }, [userId]);

  const latest = useMemo(() => recommendations[0], [recommendations]);
  const historyOnly = useMemo(
    () => (recommendations.length <= 1 ? [] : recommendations.slice(1)),
    [recommendations]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading activity recommendations...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Activity Suggestions</Text>
            </View>

            <Text style={styles.heroSub}>
              Existing saved records and new live suggestions are both shown here in newest-first order.
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>*</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Personalized for You</Text>
                <Text style={styles.infoDesc}>
                  Offline old records and live activity suggestions are merged into one timeline.
                </Text>
              </View>
            </View>

            {latest ? (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Current Suggested Activity</Text>
                <ActivityCard item={latest} highlight />

                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitleNoMargin}>Suggestion History</Text>
                </View>

                {historyOnly.length > 0 ? (
                  historyOnly.map((item, index) => (
                    <ActivityCard
                      key={item?.id || `${item?.title || "activity"}_${index}`}
                      item={item}
                    />
                  ))
                ) : (
                  <View style={styles.emptyHistoryCard}>
                    <Text style={styles.emptyHistoryText}>No older suggestions available yet.</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{errorMsg || "No activity suggestion available."}</Text>
                <Text style={styles.emptySub}>
                  Connect the watch for new suggestions. Saved records will appear here whenever available.
                </Text>

                <TouchableOpacity activeOpacity={0.85} style={styles.retryBtn} onPress={load}>
                  <Text style={styles.retryBtnText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ActivityCard({ item, highlight = false }: { item: any; highlight?: boolean }) {
  const category = item?.category ?? "Wellness";
  const tone = categoryColor(category);

  return (
    <View style={[styles.activityCard, highlight && styles.activityCardHighlight]}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.activityIcon, { backgroundColor: tone.iconBg }]}>
            <Text style={[styles.activityIconText, { color: tone.iconText }]}>{categoryIcon(category)}</Text>
          </View>

          <View style={styles.cardTitleWrap}>
            <Text style={styles.activityTitle}>{item?.title ?? "Recommended Activity"}</Text>
            <Text style={styles.activityDateText}>{formatDateTime(item?.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.nowPill}>
          <Text style={styles.nowPillText}>{item?.startLabel ?? "Now"}</Text>
        </View>
      </View>

      <Text style={styles.activityDesc}>{item?.desc ?? "No description available."}</Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaBadge, { backgroundColor: tone.badgeBg }]}>
          <Text style={[styles.metaBadgeText, { color: tone.badgeText }]}>{category}</Text>
        </View>

        <View style={styles.dot} />

        <Text style={styles.durationLabel}>Duration: {item?.duration ?? "10 min"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  scrollContent: {
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: "#178E88",
    paddingHorizontal: 20,
    paddingTop: 18,
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
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    flexShrink: 1,
  },
  heroSub: {
    color: "#EAF9F8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6FFFB",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: 18,
    color: "#0D9488",
  },
  infoTitle: {
    color: "#1E293B",
    fontSize: 17,
    marginBottom: 4,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  infoDesc: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  sectionWrap: {
    marginTop: 20,
  },
  sectionTitle: {
    color: "#1E293B",
    fontSize: 17,
    marginBottom: 12,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  sectionTitleNoMargin: {
    color: "#1E293B",
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  historyHeader: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  activityCardHighlight: {
    borderWidth: 1.2,
    borderColor: "#D8F2ED",
    shadowOpacity: 0.08,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  activityIconText: {
    fontSize: 21,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cardTitleWrap: {
    flex: 1,
    paddingTop: 2,
  },
  activityTitle: {
    color: "#1E293B",
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  activityDateText: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  nowPill: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  nowPillText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  activityDesc: {
    marginTop: 14,
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaBadgeText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 10,
  },
  durationLabel: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  emptyHistoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  emptyHistoryText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  emptyBox: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_800ExtraBold",
  },
  emptySub: {
    marginTop: 8,
    color: "#64748B",
    lineHeight: 21,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  retryBtn: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#0D9488",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_800ExtraBold",
  },
});
