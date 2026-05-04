import React, { useCallback, useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiAlertsList } from "../services/backendApi";
import {
  clearLiveAlertsUnreadVisualOnly,
  markAllAlertsReadAndSync,
  setLiveUnreadCount,
  subscribeWatchLive,
} from "../services/watchData";
import { auth } from "../services/firebase";

function levelTone(toLevel: string) {
  if (toLevel === "High") {
    return {
      iconBg: "#FFF1F1",
      accent: "#E05858",
      chipBg: "#FFE6E6",
      title: "HIGH",
      letter: "H",
    };
  }

  if (toLevel === "Medium") {
    return {
      iconBg: "#FFF7E8",
      accent: "#F5A623",
      chipBg: "#FFF1CF",
      title: "MEDIUM",
      letter: "M",
    };
  }

  if (toLevel === "Low") {
    return {
      iconBg: "#E8F7F5",
      accent: "#2BA89A",
      chipBg: "#DDF7F2",
      title: "LOW",
      letter: "L",
    };
  }

  return {
    iconBg: "#EEF4FF",
    accent: "#7FA7F7",
    chipBg: "#F5F9FF",
    title: "UPDATE",
    letter: "U",
  };
}

function formatAlertDate(item: any) {
  if (item?.createdAt) {
    const dt = new Date(item.createdAt);
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleString();
    }
  }
  return item?.dateISO || "-";
}

function alertSortValue(item: any) {
  const createdAtMs = new Date(item?.createdAt || 0).getTime();
  if (!Number.isNaN(createdAtMs) && createdAtMs > 0) {
    return createdAtMs;
  }

  const dateIsoMs = new Date(`${item?.dateISO || ""}T23:59:59`).getTime();
  if (!Number.isNaN(dateIsoMs) && dateIsoMs > 0) {
    return dateIsoMs;
  }

  return 0;
}

export default function AlertScreen() {
  const navigation = useNavigation<any>();
  const userId = auth?.currentUser?.uid || "";

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCountState] = useState(0);

  const didAutoReadRef = useRef(false);
  const liveRefreshAtRef = useRef(0);

  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setAlerts([]);
      setUnreadCountState(0);
      return {
        unreadCount: 0,
        latestMessage: "",
        latestCreatedAt: "",
      };
    }

    const res = await apiAlertsList({ userId, limit: 50 });
    const latest = res?.alerts?.[0];

    const sorted = [...(res?.alerts || [])].sort((a, b) => {
      return alertSortValue(b) - alertSortValue(a);
    });

    setAlerts(sorted);
    setUnreadCountState(Number(res?.unreadCount ?? 0));
    setLiveUnreadCount(
      Number(res?.unreadCount ?? 0),
      latest?.message ?? "",
      latest?.createdAt ?? ""
    );

    return {
      unreadCount: Number(res?.unreadCount ?? 0),
      latestMessage: latest?.message ?? "",
      latestCreatedAt: latest?.createdAt ?? "",
    };
  }, [userId]);

  const autoMarkReadOnOpen = useCallback(async () => {
    try {
      const latestState = await fetchAlerts();

      if (latestState.unreadCount > 0) {
        clearLiveAlertsUnreadVisualOnly();
        await markAllAlertsReadAndSync(userId);
        await fetchAlerts();
      }
    } catch (e) {
      console.log("auto mark read error:", e);
    }
  }, [fetchAlerts, userId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        try {
          setLoading(true);

          if (!didAutoReadRef.current) {
            await autoMarkReadOnOpen();
            didAutoReadRef.current = true;
          } else {
            await fetchAlerts();
          }
        } catch (e) {
          console.log("AlertScreen error:", e);
        } finally {
          if (active) setLoading(false);
        }
      };

      run();

      return () => {
        active = false;
        didAutoReadRef.current = false;
      };
    }, [autoMarkReadOnOpen, fetchAlerts])
  );

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeWatchLive(async () => {
      const now = Date.now();
      if (now - liveRefreshAtRef.current < 2000) return;
      liveRefreshAtRef.current = now;

      try {
        const latestState = await fetchAlerts();
        if (latestState.unreadCount > 0) {
          clearLiveAlertsUnreadVisualOnly();
          await markAllAlertsReadAndSync(userId);
          await fetchAlerts();
        }
      } catch (e) {
        console.log("alert live refresh error:", e);
      }
    });

    return unsub;
  }, [fetchAlerts, userId]);

  const onMarkAllRead = async () => {
    try {
      setMarking(true);
      clearLiveAlertsUnreadVisualOnly();
      await markAllAlertsReadAndSync(userId);
      await fetchAlerts();
    } catch (e) {
      console.log("mark all read error:", e);
    } finally {
      setMarking(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const tone = levelTone(item.toLevel ?? "");

    return (
      <View style={styles.alertCard}>
        <View style={styles.alertRow}>
          <View style={[styles.alertIcon, { backgroundColor: tone.iconBg }]}>
            <Text style={[styles.alertLetter, { color: tone.accent }]}>{tone.letter}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.alertTop}>
              <View style={[styles.levelPill, { backgroundColor: tone.chipBg }]}>
                <Text style={[styles.levelPillText, { color: tone.accent }]}>{tone.title}</Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: item.isRead ? "#F3F4F6" : "#EEFDF5" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.isRead ? "#6B7280" : "#047857" },
                  ]}
                >
                  {item.isRead ? "Read" : "Unread"}
                </Text>
              </View>
            </View>

            <Text style={styles.alertTitle}>
              {`Stress changed: ${item.fromLevel ?? "-"} to ${item.toLevel ?? "-"}`}
            </Text>

            <View style={[styles.messageBox, { borderLeftColor: tone.accent }]}>
              <Text style={styles.alertMessage}>{item.message}</Text>
            </View>

            <Text style={styles.alertMeta}>Recorded: {formatAlertDate(item)}</Text>
            {!!item?.dateISO && (
              <Text style={styles.alertMetaSecondary}>Date: {item.dateISO}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.heroTitle}>Live Alerts</Text>
        </View>

        <Text style={styles.heroSub}>
          Latest stress notifications with live time updates
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.personalizedCard}>
          <View style={styles.personalizedIcon}>
            <Text style={styles.personalizedIconText}>*</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.personalizedTitle}>Personalized for You</Text>
            <Text style={styles.personalizedDesc}>
              You have {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
              Latest stress updates appear at the top.
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markBtn, marking && { opacity: 0.7 }]}
            onPress={onMarkAllRead}
            disabled={marking}
          >
            <Text style={styles.markBtnText}>
              {marking ? "Marking..." : "Mark all as read"}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <Text style={styles.emptyText}>No alerts yet.</Text>
        ) : (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Latest Alerts</Text>
            <FlatList
              data={alerts}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7FAFC",
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
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#E6FFFB",
    lineHeight: 20,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  personalizedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  personalizedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6FFFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  personalizedIconText: {
    color: "#0D9488",
    fontSize: 18,
    fontWeight: "800",
  },
  personalizedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  personalizedDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },
  markBtn: {
    marginTop: 12,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  markBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "700",
  },
  sectionWrap: {
    marginTop: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertLetter: {
    fontSize: 20,
    fontWeight: "900",
  },
  alertTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: "900",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  messageBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  alertMeta: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  alertMetaSecondary: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },
});
