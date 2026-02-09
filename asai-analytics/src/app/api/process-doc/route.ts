import { NextRequest, NextResponse } from "next/server";
import { RAGEngine } from "@/lib/rag";
import { adminDb } from "@/lib/firebase-admin";

const ragEngine = new RAGEngine();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Fetch user config for Gemini API Key
        let userGeminiKey = process.env.GEMINI_API_KEY;
        if (userId) {
            const configSnap = await adminDb.collection('userConfigs').doc(userId).get();
            if (configSnap.exists && configSnap.data()?.geminiApiKey) {
                userGeminiKey = configSnap.data()?.geminiApiKey;
            }
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const mimeType = file.type;

        // Process document using multimodal RAG engine
        const extractedData = await ragEngine.processDocument(buffer, fileName, mimeType, userGeminiKey || undefined);


        // Index into vector store
        await ragEngine.indexData(extractedData);

        return NextResponse.json({
            success: true,
            message: `Document ${fileName} processed and indexed successfully.`,
            data: extractedData
        });

    } catch (error: any) {
        console.error("RAG processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
