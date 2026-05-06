import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const memoryProfileCache = new Map();

function cacheKey(uid) {
  return `momera_user_profile_${uid}`;
}

function normalizeUsernameValue(value) {
  return String(value || "").trim();
}

function getCachedMemoryProfile(uid) {
  const entry = memoryProfileCache.get(uid);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > PROFILE_CACHE_TTL_MS) {
    memoryProfileCache.delete(uid);
    return null;
  }
  return entry.profile;
}

async function getCachedStorageProfile(uid) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.profile) return null;
    if (Date.now() - Number(parsed.savedAt) > PROFILE_CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey(uid));
      return null;
    }
    memoryProfileCache.set(uid, {
      profile: parsed.profile,
      savedAt: Number(parsed.savedAt),
    });
    return parsed.profile;
  } catch {
    return null;
  }
}

async function setCachedProfile(uid, profile) {
  if (!uid) return;
  const payload = {
    profile,
    savedAt: Date.now(),
  };
  memoryProfileCache.set(uid, payload);
  try {
    await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(payload));
  } catch {}
}

export async function clearCachedUserProfile(uid) {
  if (!uid) return;
  memoryProfileCache.delete(uid);
  try {
    await AsyncStorage.removeItem(cacheKey(uid));
  } catch {}
}

export async function saveUserProfile(user, profile) {
  if (!user?.uid) {
    throw new Error("User session not found");
  }

  const userRef = doc(db, "users", user.uid);
  const existing = (await fetchUserProfile(user.uid, { forceRefresh: true }).catch(() => null)) || {};

  const firstName = profile.firstName ?? existing.firstName ?? "";
  const lastName = profile.lastName ?? existing.lastName ?? "";
  const username = normalizeUsernameValue(profile.username ?? existing.username ?? "");
  const primaryPhone = profile.primaryPhone ?? existing.primaryPhone ?? "";
  const secondaryPhone = profile.secondaryPhone ?? existing.secondaryPhone ?? "";
  const pendingEmail = profile.pendingEmail ?? existing.pendingEmail ?? "";
  const resolvedEmail = user.email || profile.email || existing.email || "";
  const clearedPendingEmail =
    pendingEmail && String(resolvedEmail).trim().toLowerCase() === String(pendingEmail).trim().toLowerCase()
      ? ""
      : pendingEmail;

  const nextProfile = {
    uid: user.uid,
    email: resolvedEmail,
    pendingEmail: clearedPendingEmail,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    username,
    usernameLower: username.toLowerCase(),
    dob: profile.dob ?? existing.dob ?? "",
    age: Number(profile.age ?? existing.age ?? 0),
    primaryPhone,
    secondaryPhone,
    address: profile.address ?? existing.address ?? "",
    provider: profile.provider || existing.provider || "password",
    whatsappAlertsEnabled:
      profile.whatsappAlertsEnabled ?? existing.whatsappAlertsEnabled ?? true,
    alertWhatsappPhone:
      profile.alertWhatsappPhone ||
      existing.alertWhatsappPhone ||
      secondaryPhone ||
      primaryPhone ||
      "",
    onboardingCompleted:
      profile.onboardingCompleted ?? existing.onboardingCompleted ?? false,
    onboarding: {
      ...(existing.onboarding || {}),
      ...(profile.onboarding || {}),
    },
    emailVerified: Boolean(user.emailVerified),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAt: existing.createdAt || serverTimestamp(),
  };

  await setDoc(userRef, nextProfile, { merge: true });
  await setCachedProfile(user.uid, {
    ...existing,
    ...nextProfile,
    lastLoginAt: existing.lastLoginAt || null,
    updatedAt: null,
    createdAt: existing.createdAt || null,
  });
}

export async function fetchUserProfile(uid, options = {}) {
  if (!uid) return null;

  const { forceRefresh = false } = options;

  if (!forceRefresh) {
    const memoryHit = getCachedMemoryProfile(uid);
    if (memoryHit) return memoryHit;

    const storageHit = await getCachedStorageProfile(uid);
    if (storageHit) return storageHit;
  }

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const profile = snap.data();
  await setCachedProfile(uid, profile);
  return profile;
}

export async function saveOnboardingProfile(user, onboarding) {
  if (!user?.uid) {
    throw new Error("User session not found");
  }

  const userRef = doc(db, "users", user.uid);
  const existing = (await fetchUserProfile(user.uid, { forceRefresh: true }).catch(() => null)) || {};

  const nextProfile = {
    onboarding: {
      ...(existing.onboarding || {}),
      ...onboarding,
    },
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
    createdAt: existing.createdAt || serverTimestamp(),
  };

  await setDoc(userRef, nextProfile, { merge: true });
  await setCachedProfile(user.uid, {
    ...existing,
    ...nextProfile,
    onboarding: {
      ...(existing.onboarding || {}),
      ...onboarding,
    },
    onboardingCompleted: true,
    updatedAt: null,
    createdAt: existing.createdAt || null,
  });
}
