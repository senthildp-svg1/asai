import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Google Drive Integration Utility
 * Handles authentication and file operations with Google Drive API
 */

export interface GoogleDriveConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
}

export class GoogleDriveClient {
    private oauth2Client: OAuth2Client;
    private drive: any;

    constructor(config: GoogleDriveConfig) {
        this.oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );

        this.oauth2Client.setCredentials({
            refresh_token: config.refreshToken
        });

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    /**
     * List files in a specific Google Drive folder (or root if not provided)
     */
    async listFiles(folderId?: string) {
        const query = folderId
            ? `'${folderId}' in parents and trashed = false`
            : "trashed = false";

        try {
            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, mimeType, webContentLink)',
                pageSize: 100
            });
            return response.data.files;
        } catch (error) {
            console.error("Error listing Google Drive files:", error);
            throw error;
        }
    }

    /**
     * Download file content from Google Drive
     */
    async getFileContent(fileId: string) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'arraybuffer' });

            return Buffer.from(response.data);
        } catch (error) {
            console.error("Error fetching Google Drive file content:", error);
            throw error;
        }
    }
}
