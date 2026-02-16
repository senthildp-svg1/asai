import { GoogleGenerativeAI } from "@google/generative-ai";

interface ImageGenerationOptions {
    prompt: string;
    apiKey: string;
    numberOfImages?: number;
}

interface ImageGenerationResult {
    success: boolean;
    images?: string[]; // Base64 encoded images or URLs
    error?: string;
}

/**
 * Generate architectural design images using Google's Imagen 4.0 or free fallback
 */
export async function generateArchitecturalImages(
    options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
    try {
        const { prompt, apiKey, numberOfImages = 3 } = options;

        console.log("Attempting image generation...");
        console.log("Prompt:", prompt.substring(0, 100) + "...");

        // Strategy: Try Google Imagen 4.0 first, then fallback to Pollinations.ai
        let images: string[] = [];
        let errorMsg = "";

        // 1. Try Google Imagen 4.0 (Requires Billing)
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: { sampleCount: Math.min(numberOfImages, 4) }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.predictions && Array.isArray(data.predictions)) {
                    data.predictions.forEach((pred: any) => {
                        const b64 = pred.bytesBase64Encoded || pred.imageBytes;
                        if (b64) images.push(`data:image/png;base64,${b64}`);
                    });
                }
            } else {
                const err = await response.text();
                console.warn("Google Imagen API failed (likely billing required):", err);
                if (err.includes("billing")) {
                    errorMsg = "Note: Google Imagen requires billing. Using free fallback (AI Horde).";
                }
            }
        } catch (googleErr: any) {
            console.warn("Google API call failed:", googleErr.message);
        }

        // 2. Fallback to Pollinations.ai (Fast Free Tier)
        if (images.length === 0) {
            console.log("Falling back to Pollinations.ai (Turbo)...");
            const fastImages = await generateWithPollinations(prompt, numberOfImages);
            if (fastImages.length > 0) {
                images = fastImages;
                if (!errorMsg) errorMsg = "Generated using Pollinations.ai Fast Tier (Free).";
            }
        }

        // 3. Last Resort: AI Horde (Slow but real generation)
        if (images.length === 0) {
            console.log("Falling back to AI Horde (Slow Free)...");
            const aihordeImages = await generateWithAIHorde(prompt, numberOfImages);
            if (aihordeImages.length > 0) {
                images = aihordeImages;
                if (!errorMsg) errorMsg = "Generated using AI Horde (Crowdsourced).";
            }
        }

        if (images.length === 0) {
            throw new Error("All image generation attempts timed out. Using high-quality architectural placeholders.");
        }

        return {
            success: true,
            images: images,
            error: errorMsg || undefined
        };

    } catch (error: any) {
        console.error("Image generation error:", error.message);
        return {
            success: false,
            images: getPlaceholderImages(options.numberOfImages || 3),
            error: error.message || "Currently showing architectural placeholders due to high API demand."
        };
    }
}

/**
 * Fast Free Fallback: Generate images using Pollinations.ai
 * Fetches server-side and returns Base64 to avoid browser placeholders.
 */
async function generateWithPollinations(prompt: string, count: number): Promise<string[]> {
    try {
        const images: string[] = [];
        const encodedPrompt = encodeURIComponent(prompt);

        for (let i = 0; i < count; i++) {
            const seed = Math.floor(Math.random() * 1000000);
            // Using the simple stable URL format confirmed in diagnostics
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}`;

            console.log(`Pollinations Server-Side Fetch: ${url}`);

            try {
                const response = await fetch(url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    images.push(`data:image/jpeg;base64,${base64}`);
                } else {
                    console.error(`Pollinations fetch failed: ${response.status}`);
                }
            } catch (fetchError) {
                console.error("Error fetching from Pollinations:", fetchError);
            }
        }

        return images;
    } catch (error) {
        console.error("Pollinations.ai error:", error);
        return [];
    }
}

/**
 * Free Fallback: Generate images using AI Horde (Crowdsourced)
 */
async function generateWithAIHorde(prompt: string, count: number): Promise<string[]> {
    try {
        console.log("AI Horde: Starting generation...");
        // Increase priority by providing a client agent
        // Anonymous key is low priority
        const submitResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': '0000000000',
                'Client-Agent': 'ASAI-Analytics:1.0:senthildp'
            },
            body: JSON.stringify({
                prompt: prompt,
                params: {
                    n: count,
                    steps: 20,
                    width: 512,
                    height: 512,
                    sampler_name: "k_euler_a"
                }
            })
        });

        if (!submitResponse.ok) return [];

        const submitData = await submitResponse.json();
        const requestId = submitData.id;

        // Poll for completion (Shortened for live demo)
        let isDone = false;
        let attempts = 0;
        const maxAttempts = 15; // Only wait 30 seconds for AI Horde in a live demo

        while (!isDone && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;

            const checkResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${requestId}`, {
                headers: { 'apikey': '0000000000' }
            });

            if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                isDone = checkData.done;
                // If the wait time is massive (> 300s), just abort and use another fallback
                if (checkData.wait_time > 300) {
                    console.log(`AI Horde wait time too long (${checkData.wait_time}s). Aborting.`);
                    return [];
                }
            }
        }

        // 3. Fetch results
        if (isDone) {
            const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${requestId}`, {
                headers: { 'apikey': '0000000000' }
            });

            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.generations && Array.isArray(statusData.generations)) {
                    return statusData.generations.map((gen: any) => gen.img);
                }
            }
        }

        console.warn("AI Horde generation timed out or failed to return images.");
        return [];
    } catch (error) {
        console.error("AI Horde error:", error);
        return [];
    }
}

/**
 * Fallback: Try to generate with Gemini's multimodal capabilities
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string | null> {
    try {
        // This remains a placeholder
        return null;
    } catch (error) {
        return null;
    }
}


/**
 * Get placeholder images as fallback
 */
function getPlaceholderImages(count: number): string[] {
    const placeholders = [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", // Modern house
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop", // Contemporary design
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop", // Architectural facade
    ];
    return placeholders.slice(0, count);
}

/**
 * Create architectural prompt from structural data and user query
 */
export function createArchitecturalPrompt(structuralData: string, userQuery?: string): string {
    // Extract key details from user query if provided
    let specificRequirements = "";
    if (userQuery) {
        const lowerQuery = userQuery.toLowerCase();

        // Extract plot size
        const plotMatch = lowerQuery.match(/(\d+)\s*x\s*(\d+)|(\d+)\s*sq/i);
        if (plotMatch) {
            specificRequirements += `\n- Plot size: ${plotMatch[0]}`;
        }

        // Extract floors (G+1, G+2, etc.)
        const floorMatch = lowerQuery.match(/g\+(\d+)|(\d+)\s*floor|(\d+)\s*stor/i);
        if (floorMatch) {
            const floors = floorMatch[1] || floorMatch[2] || floorMatch[3];
            specificRequirements += `\n- Building height: Ground + ${floors} floors`;
        }

        // Extract style keywords
        if (lowerQuery.includes('modern')) specificRequirements += '\n- Style: Modern contemporary';
        if (lowerQuery.includes('traditional')) specificRequirements += '\n- Style: Traditional';
        if (lowerQuery.includes('minimalist')) specificRequirements += '\n- Style: Minimalist';
        if (lowerQuery.includes('luxury')) specificRequirements += '\n- Style: Luxury premium';
    }

    return `
Professional architectural front elevation design with these specifications:
${specificRequirements}

Context from structural documents:
${structuralData.substring(0, 500)}

Design requirements:
- Photorealistic architectural rendering
- Front facade elevation view
- Modern contemporary style
- High-quality materials and textures
- Proper lighting and shadows
- Accurate proportions and scale
- Professional architectural visualization quality
- Include windows, doors, and architectural details
- Show complete building facade
    `.trim();
}

