import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { generateArchitecturalImages, createArchitecturalPrompt } from "@/lib/generate-image";

export async function POST(req: NextRequest) {
    try {
        const { query: userQuery, clientHint, userId } = await req.json();

        // 0. Dynamic Configuration: Get user's Gemini API Key if available
        let userGeminiKey = process.env.GEMINI_API_KEY;
        if (userId) {
            try {
                const configSnap = await adminDb.collection('userConfigs').doc(userId).get();
                if (configSnap.exists && configSnap.data()?.geminiApiKey) {
                    userGeminiKey = configSnap.data()?.geminiApiKey;
                    console.log("Using user-specific Gemini API Key for request.");
                }
            } catch (err) {
                console.warn("Could not fetch user-specific config from Firestore (likely Admin SDK auth issue). Falling back to environment variable.");
            }
        }

        const genAI = new GoogleGenerativeAI(userGeminiKey || "");


        if (!userQuery) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Retrieval: Query Firestore for relevant document snippets
        // Get client-specific context
        let contextualDocs: any[] = [];
        if (clientHint) {
            const clientQ = query(collection(db, "documents"), where("metadata.client", "==", clientHint), limit(5));
            const clientSnap = await getDocs(clientQ);
            contextualDocs = clientSnap.docs;
        }

        // Get recent global context (for newly synced files)
        const globalQ = query(collection(db, "documents"), orderBy("indexedAt", "desc"), limit(10));
        const globalSnap = await getDocs(globalQ);

        // Merge and deduplicate
        const allDocs = [...contextualDocs];
        globalSnap.docs.forEach(gd => {
            if (!allDocs.find(ad => ad.id === gd.id)) {
                allDocs.push(gd);
            }
        });

        const context = allDocs.map(doc => {
            const data = doc.data();
            const textContent = typeof data.text === 'string' ? data.text : (data.text?.text || JSON.stringify(data.text) || "");
            return `[File: ${data.metadata.fileName}, Client: ${data.metadata.client || 'General'}] Content: ${textContent.substring(0, 1000)}`;
        }).join("\n\n");

        // 2. Reasoning: Use Gemini to reason over context and provide answer with traceability
        const prompt = `
      You are Asai Analytics Chatbot, an expert AI assistant providing architectural and structural engineering reports for residential projects.
      
      **Project Goal:** 
      Transform technical structural data into clear, professional Project Reports that provide architectural vision and technical justification.

      **Report Structure (MANDATORY):**
      Your response MUST follow this structure with clear Markdown headers:

      # Project Elevation Report
      
      ## 1. Executive Summary
      - Provide a 2-3 sentence overview of the project context (client, location, building type).
      - Summarize your primary design recommendation.

      ## 2. Architectural Vision (Design Concept)
      - Describe the creative design recommendation in a way that is inspiring but professional.
      - Focus on the "Look and Feel" (e.g., Minimalist, Industrial, Tropical Contemporary).
      - Discuss the front elevation features (balconies, facade treatments, window placement).

      ## 3. Technical Rationale & Context
      - Explain how the structural specifications from the documents (dimensions, spans, beam depths) physically support or enable the proposed design.
      - Mention specific files or sources used: [Source: FileName].

      ## 4. Compliance & Material Specifications
      - Consolidate specific technical data here (Grade of concrete, steel types, specific dimensions).
      - List these in a clear bulleted or tabular format so they don't clutter the main report.

      **Tone & Language:**
      - Professional, authoritative, yet accessible. Avoid raw data dumps in the middle of descriptions.
      - Use active voice. Instead of "M25 is used", say "We utilize M25 grade concrete to ensure structural integrity for the cantilevered balconies."

      User Query: ${userQuery}
      
      Context (Structural Documents):
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

        if (!result) {
            throw new Error("All AI models failed to generate a response. Error: " + (lastError?.message || "Unknown error"));
        }

        const response = await result.response.text();

        // Check if user is requesting design visualizations/images
        const isDesignRequest = userQuery.toLowerCase().includes('design') ||
            userQuery.toLowerCase().includes('elevation') ||
            userQuery.toLowerCase().includes('image') ||
            userQuery.toLowerCase().includes('visual') ||
            userQuery.toLowerCase().includes('picture');

        // Prepare response with optional images
        const responseData: any = {
            answer: response,
            found: !response.includes("Not found")
        };

        // Generate images if user is requesting design visualizations
        if (isDesignRequest) {
            try {
                const vertexApiKey = process.env.VERTEX_AI_API_KEY || userGeminiKey || "";
                const imagePrompt = createArchitecturalPrompt(context, userQuery);

                const imageResult = await generateArchitecturalImages({
                    prompt: imagePrompt,
                    apiKey: vertexApiKey,
                    numberOfImages: 3
                });

                // Always include images and error/note if they exist
                responseData.images = imageResult.images || [];
                responseData.imageNote = imageResult.error || (imageResult.success
                    ? "Generated architectural design visualizations based on your specifications."
                    : "Using fallback/placeholder images. Check Google Cloud billing for premium Imagen 4.0 generation.");
            } catch (imgError: any) {
                console.error("Image generation error:", imgError);
                responseData.images = [];
                responseData.imageNote = "Could not generate images at this time. Showing text descriptions instead.";
            }
        }


        return NextResponse.json(responseData);

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
