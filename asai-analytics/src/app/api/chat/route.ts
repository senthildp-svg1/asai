import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { query: userQuery, clientHint, userId } = await req.json();

        // 0. Dynamic Configuration: Get user's Gemini API Key if available
        let userGeminiKey = process.env.GEMINI_API_KEY;
        if (userId) {
            const configSnap = await adminDb.collection('userConfigs').doc(userId).get();
            if (configSnap.exists && configSnap.data()?.geminiApiKey) {
                userGeminiKey = configSnap.data()?.geminiApiKey;
                console.log("Using user-specific Gemini API Key for request.");
            }
        }

        const genAI = new GoogleGenerativeAI(userGeminiKey || "");


        if (!userQuery) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Retrieval: Query Firestore for relevant document snippets
        let docsQuery = query(collection(db, "documents"), limit(5));
        if (clientHint) {
            docsQuery = query(collection(db, "documents"), where("metadata.client", "==", clientHint), limit(5));
        }

        const snapshot = await getDocs(docsQuery);
        const context = snapshot.docs.map(doc => {
            const data = doc.data();
            return `[File: ${data.metadata.fileName}, Client: ${data.metadata.client}] Content: ${data.text.substring(0, 1000)}`;
        }).join("\n\n");

        // 2. Reasoning: Use Gemini to reason over context and provide answer with traceability
        const prompt = `
      You are Asai Analytics Chatbot. Answer the following user query using ONLY the provided document context.
      If the information is not found in the context, respond with "Not found".
      
      For every statement, provide a citation in the format [Source: FileName, Page/Section].
      Also provided a "Justification" section explaining why this answer was pulled.

      User Query: ${userQuery}
      
      Context:
      ${context || "No context found."}
    `;

        const modelsToTry = [
            "gemini-flash-latest",
            "gemini-1.5-flash-latest",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-pro-latest"
        ];

        let result;
        let lastError: any;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying AI model: ${modelName}...`);
                const currentModel = genAI.getGenerativeModel({ model: modelName });
                result = await currentModel.generateContent(prompt);
                if (result) break;
            } catch (err: any) {
                lastError = err;
                console.error(`Model ${modelName} failed:`, err.message);
                // If it's a 404 or 429, try the next model
                if (err.message.includes("404") || err.message.includes("429") || err.message.includes("quota")) {
                    continue;
                } else {
                    throw err; // Re-throw other types of errors
                }
            }
        }

        if (!result && lastError) {
            throw lastError;
        }

        const response = await result.response.text();

        return NextResponse.json({
            answer: response,
            found: !response.includes("Not found")
        });

    } catch (error: any) {
        console.error("Chat API error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json({
            error: error.message,
            details: "Check server logs for full stack trace"
        }, { status: 500 });
    }
}
