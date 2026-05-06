import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

export function getFirebaseApp(): FirebaseApp {
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      "Thiếu biến môi trường NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }
  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApps()[0]!;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
