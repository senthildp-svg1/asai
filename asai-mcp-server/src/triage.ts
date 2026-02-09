import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TriageResult {
    client?: string;
    product?: string;
    domain?: string;
    confidence: number;
}

export class TriageEngine {

    /**
     * Triage a document based on its name and content snippet using AI
     */
    async triage(fileName: string, contentSnippet: string, apiKey?: string): Promise<TriageResult> {
        const currentApiKey = apiKey || process.env.GEMINI_API_KEY || '';
        const genAI = new GoogleGenerativeAI(currentApiKey);
        // Use 1.5-flash for efficient classification
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Analyze the following document information and categorize it for a construction project management system.
            
            FileName: ${fileName}
            ContentSnippet: ${contentSnippet}
            
            Please identify:
            1. Client (e.g., Acme Corp, Global Build, Metro Infrastructure, etc.)
            2. Product (e.g., Heavy Machinery, Safety Equipment, Building Materials, etc.)
            3. Domain (e.g., Regulations, Contracts, Technical Specifications, etc.)
            
            Return ONLY a valid JSON object with the following structure:
            {
              "client": "Name of Client or null",
              "product": "Name of Product Category or null",
              "domain": "Name of Domain Category or null",
              "confidence": 0.0 to 1.0 (numeric value)
            }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (handling potential markdown blocks or extra text)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    client: parsed.client || undefined,
                    product: parsed.product || undefined,
                    domain: parsed.domain || undefined,
                    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
                };
            }

            return { confidence: 0 };
        } catch (error) {
            console.error("AI Triage Error:", error);
            // Fallback to minimal result
            return { confidence: 0 };
        }
    }
}

