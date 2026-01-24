/**
 * Asai Analytics Triage Engine
 * Automatically categorizes documents based on content and metadata
 */

export interface TriageResult {
    client?: string;
    product?: string;
    domain?: string;
    confidence: number;
}

export class TriageEngine {
    // Keywords mapping for construction domain
    private clientKeywords = ['Acme Corp', 'Global Build', 'Metro Infrastructure'];
    private productKeywords = ['Heavy Machinery', 'Safety Equipment', 'Building Materials'];
    private domainKeywords = ['Regulations', 'Contracts', 'Technical Specifications'];

    /**
     * Triage a document based on its name and content snippet
     */
    async triage(fileName: string, contentSnippet: string): Promise<TriageResult> {
        const combinedText = `${fileName} ${contentSnippet}`.toLowerCase();

        const result: TriageResult = { confidence: 0 };

        // Triage by Client
        for (const client of this.clientKeywords) {
            if (combinedText.includes(client.toLowerCase())) {
                result.client = client;
                result.confidence += 0.4;
            }
        }

        // Triage by Product
        for (const product of this.productKeywords) {
            if (combinedText.includes(product.toLowerCase())) {
                result.product = product;
                result.confidence += 0.3;
            }
        }

        // Triage by Domain
        for (const domain of this.domainKeywords) {
            if (combinedText.includes(domain.toLowerCase())) {
                result.domain = domain;
                result.confidence += 0.3;
            }
        }

        return result;
    }
}
