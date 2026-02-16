import { NextRequest, NextResponse } from "next/server";
import { RAGEngine } from "@/lib/rag";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;
        const geminiApiKey = formData.get("geminiApiKey") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`Received local upload: ${file.name} (${file.type})`);

        // Convert file to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process with RAG Engine
        const ragEngine = new RAGEngine();
        const extracted = await ragEngine.processDocument(
            buffer,
            file.name,
            file.type,
            geminiApiKey || process.env.GEMINI_API_KEY
        );

        // Add metadata
        extracted.metadata = {
            ...extracted.metadata,
            userId: userId || 'anonymous',
            source: 'local_upload'
        };

        // Index Data
        await ragEngine.indexData(extracted);

        // Log Activity
        await addDoc(collection(db, "activities"), {
            type: 'upload',
            title: 'Local File Upload:',
            details: `Manually uploaded and indexed '${file.name}'.`,
            status: 'Complete',
            timestamp: serverTimestamp(),
            icon: '📄'
        });

        // Add an alert for structural drawings
        if (file.name.toLowerCase().includes('structural') || extracted.text.toLowerCase().includes('structural')) {
            await addDoc(collection(db, "activities"), {
                type: 'alert',
                title: 'Intelligence Alert:',
                details: `Structural Engineering context detected in '${file.name}'. Elevation advice ready.`,
                status: 'Urgent',
                timestamp: serverTimestamp(),
                icon: '🏗️'
            });
        }

        return NextResponse.json({
            success: true,
            documentId: file.name,
            extracted: {
                client: extracted.metadata.client,
                product: extracted.metadata.product
            }
        });

    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
