/**
 * Asai Analytics RAG Engine
 * Handles multimodal extraction and indexing using Gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-flash-lite-latest"];


export interface ExtractedData {
    text: string;
    tables: any[];
    visualObservations: string[];
    metadata: {
        client?: string;
        product?: string;
        domain?: string;
        fileName: string;
    };
}

export class RAGEngine {
    /**
     * Processes a multimodal document (PDF, Image, or Video)
     */
    async processDocument(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedData> {
        console.log(`Processing multimodal document: ${fileName} (${mimeType})`);

        const prompt = `
      Analyze this construction document/media and extract high-fidelity intelligence.
      1. TEXT: Extract all relevant textual information.
      2. TABLES: Convert any tables into structured JSON format.
      3. VISUALS: If it's an image or video, describe site conditions, progress, or safety observations.
      4. CLASSIFICATION: Identify the Client (e.g., Acme Corp), Product, or Domain if mentioned.
      
      Output the result as a strictly formatted JSON object with keys: text, tables, visualObservations, client, product, domain.
    `;

        try {
            let result;
            let lastError;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Trying RAG model: ${modelName}...`);
                    const currentModel = genAI.getGenerativeModel({ model: modelName });
                    result = await currentModel.generateContent([
                        prompt,
                        {
                            inlineData: {
                                data: fileBuffer.toString("base64"),
                                mimeType: mimeType,
                            },
                        },
                    ]);
                    if (result) break;
                } catch (err: any) {
                    lastError = err;
                    if (err.message.includes("404") || err.message.includes("429")) {
                        continue;
                    }
                    throw err;
                }
            }

            if (!result && lastError) throw lastError;


            const responseText = result.response.text();
            const cleanedJson = responseText.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(cleanedJson);

            return {
                text: parsedData.text || "",
                tables: parsedData.tables || [],
                visualObservations: parsedData.visualObservations || [],
                metadata: {
                    fileName,
                    client: parsedData.client,
                    product: parsedData.product,
                    domain: parsedData.domain,
                },
            };
        } catch (error) {
            console.error("Error in multimodal extraction:", error);
            throw error;
        }
    }

    /**
     * Index data into Firestore
     */
    async indexData(data: ExtractedData) {
        console.log(`Indexing document ${data.metadata.fileName} into Firestore...`);
        try {
            const docRef = await addDoc(collection(db, "documents"), {
                text: data.text,
                tables: data.tables,
                visualObservations: data.visualObservations,
                metadata: data.metadata,
                indexedAt: serverTimestamp()
            });
            console.log(`Document indexed with ID: ${docRef.id}`);
            return true;
        } catch (error) {
            console.error("Error indexing document:", error);
            throw error;
        }
    }
}
