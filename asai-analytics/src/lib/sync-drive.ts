
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { RAGEngine } from "./rag";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: "AIzaSyAU2AqiFNqbPnDVXALYVny7U-C4-EfrRxo",
    authDomain: "asai-analytics.firebaseapp.com",
    projectId: "asai-analytics",
    storageBucket: "asai-analytics.firebasestorage.app",
    messagingSenderId: "186968981168",
    appId: "1:186968981168:web:ee8779b24b9da6f4b6c575",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ragEngine = new RAGEngine();

async function syncUserDrive(userId: string, userData: any) {
    console.log(`\n--- Syncing Drive for User: ${userId} ---`);

    if (!userData.googleClientId || !userData.googleRefreshToken) {
        console.log("Missing Google credentials. Skipping.");
        return;
    }

    try {
        // 1. Get Access Token
        console.log("Refreshing Google Access Token...");
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: userData.googleClientId,
                client_secret: userData.googleClientSecret,
                refresh_token: userData.googleRefreshToken,
                grant_type: 'refresh_token',
            })
        });

        if (!tokenResp.ok) throw new Error(`Token refresh failed: ${await tokenResp.text()}`);
        const { access_token } = await tokenResp.json() as any;

        // 2. List Files (Restricted by Folder ID if present)
        console.log("Listing files from Google Drive...");
        let q = "trashed = false and (mimeType = 'application/pdf' or mimeType contains 'image/' or mimeType contains 'wordprocessingml')";
        if (userData.googleFolderId) {
            q += ` and '${userData.googleFolderId}' in parents`;
            console.log(`Applying folder restriction: ${userData.googleFolderId}`);
        }

        const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=10&fields=files(id,name,mimeType)`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!listResp.ok) throw new Error(`List files failed: ${await listResp.text()}`);
        const { files } = await listResp.json() as any;

        if (!files || files.length === 0) {
            console.log("No new files found to sync.");
            return;
        }

        console.log(`Found ${files.length} candidate files or images.`);

        // 3. Process each file
        for (const file of files) {
            // Check if already indexed
            const dupQuery = query(collection(db, "documents"), where("metadata.fileName", "==", file.name));
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
                console.log(`Skipping ${file.name} (already indexed).`);
                continue;
            }

            console.log(`Syncing content for: ${file.name}...`);

            // Download content
            const mediaResp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            if (!mediaResp.ok) {
                console.error(`Failed to download ${file.name}. Skipping.`);
                continue;
            }

            const buffer = Buffer.from(await mediaResp.arrayBuffer());

            // Use RAG Engine to analyze (Gemini Multimodal)
            console.log(`AI Intelligence extraction starting for ${file.name}...`);
            const extracted = await ragEngine.processDocument(
                buffer,
                file.name,
                file.mimeType,
                userData.geminiApiKey || process.env.GEMINI_API_KEY
            );

            // Add userId to metadata
            extracted.metadata = {
                ...extracted.metadata,
                userId: userId,
                source: 'googledrive'
            };

            // Save to Firestore
            await ragEngine.indexData(extracted);

            // Log Activity
            await setDoc(doc(collection(db, "activities")), {
                type: 'sync',
                title: 'Google Drive Sync:',
                details: `Processed and indexed '${file.name}' from Cloud.`,
                status: 'Complete',
                timestamp: serverTimestamp(),
                icon: '☁️'
            });

            console.log(`Successfully triaged and indexed ${file.name}`);
        }

    } catch (error: any) {
        console.error(`Sync error for ${userId}:`, error.message);
    }
}

async function main() {
    try {
        console.log("Starting Global Cloud Sync Engine...");
        const snapshot = await getDocs(collection(db, "userConfigs"));

        console.log(`Found ${snapshot.docs.length} user configurations.`);
        for (const d of snapshot.docs) {
            await syncUserDrive(d.id, d.data());
        }

        console.log("\n--- Sync Cycle Complete ---");
    } catch (err: any) {
        console.error("CRITICAL SYNC ENGINE ERROR:", err.stack || err.message);
        process.exit(1);
    }
}

main().catch(console.error);
