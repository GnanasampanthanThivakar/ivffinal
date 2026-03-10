import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { apiActivitiesList, ActivityCatalogItem } from "../services/backendApi";
import { getTodayFromWatchOrBackend } from "../services/watchData";

type FilterKey = "Today" | "Week" | "Month";

const userId = "user_1";

function categoryColor(category: string) {
  if (category === "Mindfulness") {
    return {
      iconBg: "#F3ECFF",
      accent: "#B39DDB",
      chipBg: "#F5F0FF",
    };
  }
  if (category === "Movement") {
    return {
      iconBg: "#FFF1E8",
      accent: "#F4A77A",
      chipBg: "#FFF5EE",
    };
  }
  if (category === "Sleep") {
    return {
      iconBg: "#E9F0FF",
      accent: "#7FA7F7",
      chipBg: "#EEF4FF",
    };
  }
  return {
    iconBg: "#E8F7F5",
    accent: "#4DB6AC",
    chipBg: "#EDF9F7",
  };
}

function categoryIcon(category: string) {
  if (category === "Mindfulness") return "✦";
  if (category === "Movement") return "◌";
  if (category === "Sleep") return "☾";
  return "◍";
}

export default function ActivityScreen() {
  const [items, setItems] = useState<ActivityCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("Today");
  const [topRecoTitle, setTopRecoTitle] = useState<string | null>(null);
  const [topRecoDesc, setTopRecoDesc] = useState<string | null>(null);
  const [topRecoDuration, setTopRecoDuration] = useState<string | null>(null);
  const [topRecoCategory, setTopRecoCategory] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [res, today] = await Promise.all([
        apiActivitiesList(),
        getTodayFromWatchOrBackend(userId),
      ]);

      const list = res.activities ?? [];
      setItems(list);

      if (today?.recommendation) {
        setTopRecoTitle(today.recommendation.title ?? null);
        setTopRecoDesc(today.recommendation.desc ?? null);
        setTopRecoDuration(today.recommendation.duration ?? null);
        setTopRecoCategory(today.recommendation.category ?? null);
      } else {
        setTopRecoTitle(null);
        setTopRecoDesc(null);
        setTopRecoDuration(null);
        setTopRecoCategory(null);
      }
    } catch (e) {
      console.log(e);
      setErrorMsg("Failed to load activities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const personalizedItem = useMemo(() => {
    if (!topRecoTitle) return null;
    return items.find((x) => x.title === topRecoTitle) ?? null;
  }, [items, topRecoTitle]);

  const recommendedForYou = useMemo(() => {
    if (!personalizedItem) return items;
    const rest = items.filter((x) => x.title !== personalizedItem.title);
    return [personalizedItem, ...rest];
  }, [items, personalizedItem]);

  const grouped = useMemo(() => {
    const g: Record<string, ActivityCatalogItem[]> = {
      Mindfulness: [],
      Movement: [],
      Sleep: [],
      Wellness: [],
      Other: [],
    };

    for (const it of recommendedForYou) {
      if (g[it.category]) g[it.category].push(it);
      else g.Other.push(it);
    }

    return g;
  }, [recommendedForYou]);

  const visibleSections = useMemo(() => {
    if (filter === "Today") {
      return [
        { title: "Recommended for You", items: recommendedForYou.slice(0, 6) },
      ];
    }

    if (filter === "Week") {
      return [
        { title: "Mindfulness", items: grouped.Mindfulness },
        { title: "Movement", items: grouped.Movement },
        { title: "Sleep", items: grouped.Sleep },
        { title: "Wellness", items: grouped.Wellness },
      ];
    }

    return [
      { title: "All Activities", items: recommendedForYou },
    ];
  }, [filter, recommendedForYou, grouped]);

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading activities...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Text style={{ fontWeight: "900" }}>{errorMsg}</Text>
          <Text style={styles.errorSub}>Backend run ஆகணும் + activities API work ஆகணும்.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.backText}>← Back</Text>

            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Activities</Text>
              <View style={styles.personalChip}>
                <Text style={styles.personalChipText}>AI Personalized</Text>
              </View>
            </View>

            <Text style={styles.heroSub}>
              Positive activities to nurture your wellness journey
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.personalizedCard}>
              <View style={styles.personalizedIcon}>
                <Text style={{ color: "#B39DDB", fontSize: 18 }}>✦</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.personalizedTitle}>Personalized for You</Text>
                <Text style={styles.personalizedDesc}>
                  {topRecoDesc
                    ? "Your latest stress-aware recommendation is ready. Follow this gentle activity to support your wellbeing."
                    : "You're doing great! These activities will help you continue nurturing your wellbeing."}
                </Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              {(["Today", "Week", "Month"] as FilterKey[]).map((key) => {
                const active = filter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.85}
                    onPress={() => setFilter(key)}
                    style={[styles.filterBtn, active && styles.filterBtnActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {personalizedItem && filter === "Today" ? (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <ActivityCard
                  item={{
                    ...personalizedItem,
                    durationMin:
                      Number(topRecoDuration?.replace(/\D/g, "")) || personalizedItem.durationMin,
                    category: topRecoCategory || personalizedItem.category,
                  }}
                  highlight
                />
              </View>
            ) : null}

            {visibleSections.map((section, idx) => {
              const list =
                personalizedItem && filter === "Today" && section.title === "Recommended for You"
                  ? section.items.filter((x) => x.title !== personalizedItem.title)
                  : section.items;

              if (!list.length) return null;

              return (
                <View key={`${section.title}_${idx}`} style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {list.map((item) => (
                    <ActivityCard key={item.id} item={item} />
                  ))}
                </View>
              );
            })}

            {recommendedForYou.length === 0 ? (
              <Text style={styles.emptyText}>No activities available right now.</Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ActivityCard(props: { item: ActivityCatalogItem; highlight?: boolean }) {
  const tone = categoryColor(props.item.category);

  return (
    <View style={[styles.activityCard, props.highlight && styles.highlightCard]}>
      <View style={styles.activityRow}>
        <View style={[styles.activityIcon, { backgroundColor: tone.iconBg }]}>
          <Text style={{ color: tone.accent, fontSize: 20 }}>{categoryIcon(props.item.category)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.activityTop}>
            <Text style={styles.activityTitle}>{props.item.title}</Text>
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{props.item.durationMin} min</Text>
            </View>
          </View>

          <Text style={styles.activityDesc}>{props.item.description}</Text>
          <Text style={styles.activityCategory}>{props.item.category}</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.startBtn,
              { backgroundColor: tone.accent },
            ]}
          >
            <Text style={styles.startBtnText}>Start Activity</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F8FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },

  hero: {
    backgroundColor: "#4FB1AF",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  personalChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  personalChipText: {
    color: "#4FB1AF",
    fontWeight: "800",
    fontSize: 13,
  },
  heroSub: {
    color: "#EAF9F8",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    lineHeight: 20,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  personalizedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  personalizedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F7F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  personalizedTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1F2A37",
    marginBottom: 6,
  },
  personalizedDesc: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  filterBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  filterBtnActive: {
    backgroundColor: "#4FB1AF",
  },
  filterText: {
    color: "#526277",
    fontWeight: "800",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },

  sectionWrap: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2A37",
    marginBottom: 12,
  },

  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  highlightCard: {
    borderWidth: 1,
    borderColor: "#DDEFEF",
  },
  activityRow: {
    flexDirection: "row",
    gap: 14,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  activityTitle: {
    flex: 1,
    color: "#1F2A37",
    fontSize: 16,
    fontWeight: "900",
  },
  durationPill: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D7DEE8",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    color: "#5B6677",
    fontSize: 12,
    fontWeight: "800",
  },
  activityDesc: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  activityCategory: {
    marginTop: 8,
    color: "#7C8A9C",
    fontWeight: "700",
    fontSize: 13,
  },
  startBtn: {
    alignSelf: "flex-start",
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  emptyText: {
    marginTop: 20,
    color: "#64748B",
    fontWeight: "800",
  },

  errorSub: {
    marginTop: 8,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },
});