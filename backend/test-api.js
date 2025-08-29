import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testApi() {
    try {
        console.log('Testing API connection...');
        
        // Test root endpoint
        const rootResponse = await fetch(BASE_URL);
        if (!rootResponse.ok) {
            throw new Error(`Failed to connect to API: ${rootResponse.status} ${rootResponse.statusText}`);
        }
        
        const rootData = await rootResponse.text();
        console.log('Root endpoint response:', rootData);
        console.log('✅ API connection successful');
        
        return true;
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

// Run the test
testApi()
    .then(success => {
        if (success) {
            console.log('All tests passed! The backend is running correctly.');
        } else {
            console.log('Tests failed. Please check the error messages above.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Unexpected error during testing:', error);
        process.exit(1);
    });