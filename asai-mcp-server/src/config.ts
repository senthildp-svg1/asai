```typescript
import admin from "firebase-admin";

// Initialize Firebase Admin with project ID from environment or default
if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    console.error("--- Firebase Initialization Debug ---");
    if (serviceAccountVar) {
        console.error(`FIREBASE_SERVICE_ACCOUNT found(Length: ${ serviceAccountVar.length })`);
        console.error(`Starts with: ${ serviceAccountVar.substring(0, 10) }...`);
        try {
            const serviceAccount = JSON.parse(serviceAccountVar);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
            });
            console.error("SUCCESS: Firebase initialized with Service Account.");
        } catch (e: any) {
            console.error("CRITICAL ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON!");
            console.error("Error Message: " + e.message);
            // Don't fall back to default, it will just fail later with confusing errors
            throw new Error("Could not initialize Firebase: Malformed Service Account JSON.");
        }
    } else {
        console.error("CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT is MISSING from environment!");
        console.error("Please add it to Render -> Environment Variables.");
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'asai-analytics',
        });
    }
    console.error("--------------------------------------");
}

export const db = admin.firestore();

export interface UserProviderConfig {
    google?: {
        clientId: string;
        clientSecret: string;
        refreshToken: string;
        redirectUri: string;
    };
    microsoft?: {
        clientId: string;
        clientSecret: string;
        tenantId: string;
    };
    geminiApiKey?: string;
}

/**
 * Fetches user configuration from Firestore or falls back to environment variables.
 */
export async function getUserConfig(userId?: string): Promise<UserProviderConfig> {
    const config: UserProviderConfig = {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
            redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost'
        },
        microsoft: {
            clientId: process.env.MS_CLIENT_ID || '',
            clientSecret: process.env.MS_CLIENT_SECRET || '',
            tenantId: process.env.MS_TENANT_ID || 'common'
        },
        geminiApiKey: process.env.GEMINI_API_KEY
    };

    if (!userId) {
        return config;
    }

    try {
        const docRef = db.collection('userConfigs').doc(userId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (data) {
                if (data.googleClientId) {
                    config.google!.clientId = data.googleClientId;
                    config.google!.clientSecret = data.googleClientSecret;
                    config.google!.refreshToken = data.googleRefreshToken;
                }
                if (data.msClientId) {
                    config.microsoft!.clientId = data.msClientId;
                    config.microsoft!.clientSecret = data.msClientSecret;
                    config.microsoft!.tenantId = data.msTenantId || 'common';
                }
                if (data.geminiApiKey) {
                    config.geminiApiKey = data.geminiApiKey;
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching user config for ${ userId }: `, error);
    }

    return config;
}
