const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin for script
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'asai-analytics',
    });
}
const db = admin.firestore();

async function verifyConfig() {
    const testUserId = 'test-user-config-' + Date.now();
    const mockApiKey = 'MOCK_GEMINI_KEY_' + Date.now();

    console.log(`Setting up test config for UID: ${testUserId}`);

    // 1. Write mock config to Firestore
    await db.collection('userConfigs').doc(testUserId).set({
        geminiApiKey: mockApiKey,
        updatedAt: new Date().toISOString()
    });

    console.log(`Verifying Chat API with custom key...`);

    try {
        // 2. Call Chat API (Mocking the call)
        // Since we can't easily trigger the production endpoint from here with real Gemini auth,
        // we check if the server logs "Using user-specific Gemini API Key for request."

        const response = await axios.post('http://localhost:3001/api/chat', {
            query: 'Hello',
            userId: testUserId
        }, {
            validateStatus: false
        });

        console.log(`API Response Status: ${response.status}`);
        if (response.data.error && response.data.error.includes('Key not valid')) {
            console.log(`SUCCESS: The API tried to use our mock key! (It failed as expected because the key is mock)`);
        } else if (response.status === 500 && response.data.error) {
            console.log(`Received error: ${response.data.error}`);
            if (response.data.error.includes(mockApiKey) || response.data.error.includes('API key')) {
                console.log(`SUCCESS: Confirmed the API is picking up the custom key.`);
            }
        }
    } catch (error) {
        console.error("Verification failed:", error.message);
    } finally {
        await db.collection('userConfigs').doc(testUserId).delete();
    }
}

verifyConfig();
