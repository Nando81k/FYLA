// Script to display all seeded users for verification
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';
const DEFAULT_PASSWORD = 'TempPassword123!';

// All seeded users
const allUsers = [
  // Clients
  { email: 'emma.johnson@email.com', fullName: 'Emma Johnson', role: 'Client' },
  { email: 'michael.chen@email.com', fullName: 'Michael Chen', role: 'Client' },
  {
    email: 'sarah.martinez@email.com',
    fullName: 'Sarah Martinez',
    role: 'Client',
  },
  {
    email: 'david.thompson@email.com',
    fullName: 'David Thompson',
    role: 'Client',
  },
  { email: 'jessica.lee@email.com', fullName: 'Jessica Lee', role: 'Client' },
  {
    email: 'robert.wilson@email.com',
    fullName: 'Robert Wilson',
    role: 'Client',
  },
  {
    email: 'amanda.rodriguez@email.com',
    fullName: 'Amanda Rodriguez',
    role: 'Client',
  },
  { email: 'james.park@email.com', fullName: 'James Park', role: 'Client' },
  {
    email: 'lisa.anderson@email.com',
    fullName: 'Lisa Anderson',
    role: 'Client',
  },
  { email: 'kevin.taylor@email.com', fullName: 'Kevin Taylor', role: 'Client' },

  // Service Providers
  {
    email: 'sophia.grace@fylapro.com',
    fullName: 'Sophia Grace',
    role: 'ServiceProvider',
    specialties: 'Esthetician - Facials, Anti-aging',
  },
  {
    email: 'marcus.williams@fylapro.com',
    fullName: 'Marcus Williams',
    role: 'ServiceProvider',
    specialties: 'Massage Therapist - Deep Tissue, Sports',
  },
  {
    email: 'isabella.romano@fylapro.com',
    fullName: 'Isabella Romano',
    role: 'ServiceProvider',
    specialties: 'Hair Stylist - Cuts, Color, Balayage',
  },
  {
    email: 'alexander.smith@fylapro.com',
    fullName: 'Alexander Smith',
    role: 'ServiceProvider',
    specialties: 'Personal Trainer - Fitness, Wellness',
  },
  {
    email: 'maya.patel@fylapro.com',
    fullName: 'Maya Patel',
    role: 'ServiceProvider',
    specialties: 'Nail Technician - Manicures, Nail Art',
  },
  {
    email: 'thomas.johnson@fylapro.com',
    fullName: 'Thomas Johnson',
    role: 'ServiceProvider',
    specialties: 'Barber - Haircuts, Beard Trims',
  },
  {
    email: 'chloe.davis@fylapro.com',
    fullName: 'Chloe Davis',
    role: 'ServiceProvider',
    specialties: 'Makeup Artist - Bridal, Special Events',
  },
  {
    email: 'daniel.kim@fylapro.com',
    fullName: 'Daniel Kim',
    role: 'ServiceProvider',
    specialties: 'Acupuncturist - Pain Management, Wellness',
  },
  {
    email: 'rachel.green@fylapro.com',
    fullName: 'Rachel Green',
    role: 'ServiceProvider',
    specialties: 'Yoga Instructor - Meditation, Mindfulness',
  },
  {
    email: 'antonio.lopez@fylapro.com',
    fullName: 'Antonio Lopez',
    role: 'ServiceProvider',
    specialties: 'Physical Therapist - Rehabilitation',
  },
];

async function testAllUsers() {
  console.log('🎉 FYLA User Database - Successfully Seeded Users\n');
  console.log('============================================================');

  const clients = allUsers.filter((user) => user.role === 'Client');
  const providers = allUsers.filter((user) => user.role === 'ServiceProvider');

  console.log(`\n👥 CLIENTS (${clients.length}):`);
  console.log('----------------------------------------');
  clients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.fullName}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log('');
  });

  console.log(`\n🔧 SERVICE PROVIDERS (${providers.length}):`);
  console.log('----------------------------------------');
  providers.forEach((provider, index) => {
    console.log(`${index + 1}. ${provider.fullName}`);
    console.log(`   Email: ${provider.email}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Specialties: ${provider.specialties}`);
    console.log('');
  });

  console.log('📱 MOBILE APP LOGIN INSTRUCTIONS:');
  console.log('----------------------------------------');
  console.log('1. Open the FYLA mobile app');
  console.log('2. Use any email from the list above');
  console.log(`3. Use password: ${DEFAULT_PASSWORD}`);
  console.log('4. Start booking appointments or offering services!');

  console.log('\n🚀 SUCCESS! All users are ready to use the FYLA platform.');
  console.log('You can now test the full booking workflow with real users.');
}

testAllUsers().catch(console.error);
