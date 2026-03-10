import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchVitalsForUser(userId: string) {
  try {
    const vitalsRef = collection(db, "vitals");
    const q = query(vitalsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const vitals: any[] = [];
    snapshot.forEach((doc) => {
      vitals.push({ id: doc.id, ...doc.data() });
    });

    return vitals;
  } catch (error) {
    console.error("Error fetching vitals:", error);
    return [];
  }
}
