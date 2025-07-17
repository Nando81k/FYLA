#!/usr/bin/env node

// Test script to check provider appointment update functionality

const API_BASE_URL = 'http://192.168.1.185:5002/api';

async function testProviderLogin() {
  console.log('🔍 Testing provider login and appointment update...');

  try {
    // Login as provider (Sophia Grace)
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sophia.grace@fylapro.com',
        password: 'TempPassword123!',
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Provider login successful');

    const token = loginData.token;

    // Get appointments for the provider
    const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!appointmentsResponse.ok) {
      console.error(
        '❌ Failed to get appointments:',
        await appointmentsResponse.text()
      );
      return;
    }

    const appointmentsData = await appointmentsResponse.json();
    console.log(
      '📋 Provider appointments:',
      JSON.stringify(appointmentsData, null, 2)
    );

    // Try to update the first appointment if it exists
    if (
      appointmentsData.appointments &&
      appointmentsData.appointments.length > 0
    ) {
      const firstAppointment = appointmentsData.appointments[0];
      console.log(`🔄 Trying to update appointment ID: ${firstAppointment.id}`);

      const updateResponse = await fetch(
        `${API_BASE_URL}/appointments/${firstAppointment.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Status: 1, // Confirmed
            Notes: 'Confirmed by provider - test note',
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error('❌ Update failed:', await updateResponse.text());
        return;
      }

      const updateData = await updateResponse.json();
      console.log(
        '✅ Appointment updated successfully:',
        JSON.stringify(updateData, null, 2)
      );
    } else {
      console.log('ℹ️ No appointments found for provider');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProviderLogin();
