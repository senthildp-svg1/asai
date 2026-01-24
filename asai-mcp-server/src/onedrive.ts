import axios from 'axios';
import * as msal from '@azure/msal-node';

/**
 * OneDrive Integration Utility
 * Handles authentication and file operations with Microsoft Graph API
 */

export class OneDriveClient {
    private msalConfig: msal.Configuration;
    private cca: msal.ConfidentialClientApplication;

    constructor() {
        this.msalConfig = {
            auth: {
                clientId: process.env.MS_CLIENT_ID || '',
                authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID || 'common'}`,
                clientSecret: process.env.MS_CLIENT_SECRET || '',
            }
        };
        this.cca = new msal.ConfidentialClientApplication(this.msalConfig);
    }

    async getAccessToken() {
        const clientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };

        const response = await this.cca.acquireTokenByClientCredential(clientCredentialRequest);
        return response?.accessToken;
    }

    async listFiles(itemId: string = 'root') {
        const token = await this.getAccessToken();
        const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/children`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data.value;
    }

    async getFileContent(fileId: string) {
        const token = await this.getAccessToken();
        const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            }
        );
        return response.data;
    }
}
