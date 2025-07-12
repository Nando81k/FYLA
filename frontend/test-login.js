// Simple test script to verify frontend-backend connectivity
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing backend connectivity...');

    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5002/api/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test login
    const loginResponse = await axios.post(
      'http://localhost:5002/api/auth/login',
      {
        email: 'emma.johnson@email.com',
        password: 'TempPassword123!',
      }
    );

    console.log('✅ Login successful:', {
      user: loginResponse.data.user.fullName,
      email: loginResponse.data.user.email,
      role: loginResponse.data.user.role,
    });

    // Test appointments endpoint
    const appointmentsResponse = await axios.get(
      'http://localhost:5002/api/appointments',
      {
        headers: {
          Authorization: `Bearer ${loginResponse.data.token}`,
        },
      }
    );

    console.log(
      '✅ Appointments loaded:',
      appointmentsResponse.data.appointments.length,
      'appointments'
    );

    console.log(
      '\n🎉 All tests passed! Backend is ready for frontend connectivity.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testLogin();
