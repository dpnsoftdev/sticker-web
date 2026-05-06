import admin from "firebase-admin";
import pino from "pino";

import { env } from "@/common/utils/envConfig";

const log = pino({ name: "firebase-admin" });

/**
 * Firebase Admin for verifying Phone Auth ID tokens (order track).
 * Set FIREBASE_SERVICE_ACCOUNT_JSON to the service account JSON string, or use Application Default Credentials.
 */
export function getFirebaseAuth(): admin.auth.Auth {
  if (!admin.apps.length) {
    const json = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (json) {
      const credentials = JSON.parse(json) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    log.info("Firebase Admin initialized");
  }
  return admin.auth();
}
