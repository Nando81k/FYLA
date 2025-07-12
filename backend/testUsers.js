// Test script to verify users were created and test login
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';

// Test users
const testUsers = [
  { email: 'emma.johnson@email.com', password: 'TempPassword123!' },
  { email: 'sophia.grace@fylapro.com', password: 'TempPassword123!' },
];

async function testLogin(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    console.log(`✅ Login successful for ${email}`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Role: ${response.data.user.role}`);
    console.log(`   Name: ${response.data.user.fullName}`);
    console.log(`   Token: ${response.data.token.substring(0, 20)}...`);

    return response.data;
  } catch (error) {
    console.error(
      `❌ Login failed for ${email}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing user logins...\n');

  for (const user of testUsers) {
    await testLogin(user.email, user.password);
    console.log('');
  }

  console.log('✅ User testing completed!');
}

runTests().catch(console.error);
