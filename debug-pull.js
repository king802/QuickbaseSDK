import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function debugPull() {
    console.log('🔍 Debug Information:');
    console.log('Realm:', process.env.QB_REALM);
    console.log('Token:', process.env.QB_USER_TOKEN ? `${process.env.QB_USER_TOKEN.substring(0, 10)}...` : 'NOT SET');
    console.log('App ID:', 'bsmgdfskx');
    console.log('');

    const client = axios.create({
        baseURL: 'https://api.quickbase.com/v1',
        headers: {
            'QB-Realm-Hostname': process.env.QB_REALM,
            'Authorization': `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    // Add request/response interceptors to log details
    client.interceptors.request.use(request => {
        console.log('📤 Request Details:');
        console.log('URL:', request.url);
        console.log('Method:', request.method);
        console.log('Headers:', {
            ...request.headers,
            'Authorization': 'QB-USER-TOKEN [HIDDEN]'
        });
        return request;
    });

    client.interceptors.response.use(
        response => response,
        error => {
            console.log('❌ Error Response:');
            console.log('Status:', error.response?.status);
            console.log('Status Text:', error.response?.statusText);
            console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
            console.log('Headers:', error.response?.headers);
            throw error;
        }
    );

    try {
        console.log('\n1️⃣ Testing GET /apps/bsmgdfskx');
        const appResponse = await client.get(`/apps/bsmgdfskx`);
        console.log('✅ App found:', appResponse.data.name);

        console.log('\n2️⃣ Testing GET /tables with appId parameter');
        const tablesResponse = await client.get('/tables', {
            params: { appId: 'bsmgdfskx' }
        });
        console.log('✅ Found', tablesResponse.data.length, 'tables');

    } catch (error) {
        console.error('\n💥 Full error object:', error.toJSON ? error.toJSON() : error);
    }
}

debugPull();