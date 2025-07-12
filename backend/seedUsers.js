// Seed script to add 10 clients and 10 service providers
// This script will create realistic user data for testing and development

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5002/api';
const DEFAULT_PASSWORD = 'TempPassword123!';

// Client data
const clients = [
  {
    fullName: 'Emma Johnson',
    email: 'emma.johnson@email.com',
    phoneNumber: '+1-555-0101',
    role: 'Client',
    bio: 'Love trying new beauty treatments and wellness services.',
    locationLat: 40.7128,
    locationLng: -74.006,
  },
  {
    fullName: 'Michael Chen',
    email: 'michael.chen@email.com',
    phoneNumber: '+1-555-0102',
    role: 'Client',
    bio: 'Fitness enthusiast looking for massage therapy and recovery services.',
    locationLat: 40.758,
    locationLng: -73.9855,
  },
  {
    fullName: 'Sarah Martinez',
    email: 'sarah.martinez@email.com',
    phoneNumber: '+1-555-0103',
    role: 'Client',
    bio: 'Working mom who needs convenient beauty and wellness services.',
    locationLat: 40.7505,
    locationLng: -73.9934,
  },
  {
    fullName: 'David Thompson',
    email: 'david.thompson@email.com',
    phoneNumber: '+1-555-0104',
    role: 'Client',
    bio: 'Business professional seeking grooming and wellness services.',
    locationLat: 40.7614,
    locationLng: -73.9776,
  },
  {
    fullName: 'Jessica Lee',
    email: 'jessica.lee@email.com',
    phoneNumber: '+1-555-0105',
    role: 'Client',
    bio: 'College student interested in affordable beauty treatments.',
    locationLat: 40.7282,
    locationLng: -73.9942,
  },
  {
    fullName: 'Robert Wilson',
    email: 'robert.wilson@email.com',
    phoneNumber: '+1-555-0106',
    role: 'Client',
    bio: 'Retired gentleman looking for relaxation and wellness services.',
    locationLat: 40.7831,
    locationLng: -73.9712,
  },
  {
    fullName: 'Amanda Rodriguez',
    email: 'amanda.rodriguez@email.com',
    phoneNumber: '+1-555-0107',
    role: 'Client',
    bio: 'Healthcare worker who values self-care and wellness.',
    locationLat: 40.7363,
    locationLng: -74.0056,
  },
  {
    fullName: 'James Park',
    email: 'james.park@email.com',
    phoneNumber: '+1-555-0108',
    role: 'Client',
    bio: 'Tech professional seeking stress relief and grooming services.',
    locationLat: 40.7589,
    locationLng: -73.9851,
  },
  {
    fullName: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    phoneNumber: '+1-555-0109',
    role: 'Client',
    bio: 'Busy executive who needs efficient beauty and wellness solutions.',
    locationLat: 40.7549,
    locationLng: -73.984,
  },
  {
    fullName: 'Kevin Taylor',
    email: 'kevin.taylor@email.com',
    phoneNumber: '+1-555-0110',
    role: 'Client',
    bio: 'Athlete looking for recovery and performance enhancement services.',
    locationLat: 40.7282,
    locationLng: -73.9942,
  },
];

// Service provider data
const serviceProviders = [
  {
    fullName: 'Sophia Grace',
    email: 'sophia.grace@fylapro.com',
    phoneNumber: '+1-555-0201',
    role: 'ServiceProvider',
    bio: 'Licensed esthetician specializing in facials, chemical peels, and anti-aging treatments. 8+ years experience.',
    locationLat: 40.7128,
    locationLng: -74.006,
    specialties: ['Facials', 'Chemical Peels', 'Anti-aging', 'Skincare'],
    experience: '8+ years',
    certifications: ['Licensed Esthetician', 'Chemical Peel Certification'],
  },
  {
    fullName: 'Marcus Williams',
    email: 'marcus.williams@fylapro.com',
    phoneNumber: '+1-555-0202',
    role: 'ServiceProvider',
    bio: 'Professional massage therapist offering deep tissue, Swedish, and sports massage. Certified in multiple modalities.',
    locationLat: 40.758,
    locationLng: -73.9855,
    specialties: [
      'Deep Tissue Massage',
      'Swedish Massage',
      'Sports Massage',
      'Trigger Point',
    ],
    experience: '6+ years',
    certifications: [
      'Licensed Massage Therapist',
      'Sports Massage Certification',
    ],
  },
  {
    fullName: 'Isabella Romano',
    email: 'isabella.romano@fylapro.com',
    phoneNumber: '+1-555-0203',
    role: 'ServiceProvider',
    bio: 'Master stylist and colorist with expertise in cuts, color, and styling. Trained in latest trends and techniques.',
    locationLat: 40.7505,
    locationLng: -73.9934,
    specialties: ['Hair Cutting', 'Hair Coloring', 'Styling', 'Balayage'],
    experience: '10+ years',
    certifications: [
      'Master Stylist',
      'Color Specialist',
      'Balayage Certification',
    ],
  },
  {
    fullName: 'Alexander Smith',
    email: 'alexander.smith@fylapro.com',
    phoneNumber: '+1-555-0204',
    role: 'ServiceProvider',
    bio: 'Certified personal trainer and wellness coach. Specializes in strength training, weight loss, and lifestyle coaching.',
    locationLat: 40.7614,
    locationLng: -73.9776,
    specialties: [
      'Personal Training',
      'Weight Loss',
      'Strength Training',
      'Wellness Coaching',
    ],
    experience: '5+ years',
    certifications: [
      'NASM Certified Personal Trainer',
      'Wellness Coach Certification',
    ],
  },
  {
    fullName: 'Maya Patel',
    email: 'maya.patel@fylapro.com',
    phoneNumber: '+1-555-0205',
    role: 'ServiceProvider',
    bio: 'Certified nail technician offering manicures, pedicures, and nail art. Specializes in gel and acrylic applications.',
    locationLat: 40.7282,
    locationLng: -73.9942,
    specialties: [
      'Manicures',
      'Pedicures',
      'Nail Art',
      'Gel Nails',
      'Acrylic Nails',
    ],
    experience: '4+ years',
    certifications: ['Licensed Nail Technician', 'Gel Certification'],
  },
  {
    fullName: 'Thomas Johnson',
    email: 'thomas.johnson@fylapro.com',
    phoneNumber: '+1-555-0206',
    role: 'ServiceProvider',
    bio: 'Professional barber with classic and modern cutting techniques. Specializes in fades, beard trims, and grooming.',
    locationLat: 40.7831,
    locationLng: -73.9712,
    specialties: ['Haircuts', 'Fades', 'Beard Trims', 'Shaves', 'Grooming'],
    experience: '7+ years',
    certifications: ['Licensed Barber', 'Traditional Shaving Certification'],
  },
  {
    fullName: 'Chloe Davis',
    email: 'chloe.davis@fylapro.com',
    phoneNumber: '+1-555-0207',
    role: 'ServiceProvider',
    bio: 'Makeup artist specializing in bridal, special events, and editorial makeup. Trained in various techniques and styles.',
    locationLat: 40.7363,
    locationLng: -74.0056,
    specialties: [
      'Bridal Makeup',
      'Special Events',
      'Editorial Makeup',
      'Airbrush',
    ],
    experience: '6+ years',
    certifications: ['Professional Makeup Artist', 'Airbrush Certification'],
  },
  {
    fullName: 'Daniel Kim',
    email: 'daniel.kim@fylapro.com',
    phoneNumber: '+1-555-0208',
    role: 'ServiceProvider',
    bio: 'Licensed acupuncturist and wellness practitioner. Specializes in pain management, stress relief, and holistic healing.',
    locationLat: 40.7589,
    locationLng: -73.9851,
    specialties: [
      'Acupuncture',
      'Pain Management',
      'Stress Relief',
      'Holistic Healing',
    ],
    experience: '9+ years',
    certifications: ['Licensed Acupuncturist', 'Traditional Chinese Medicine'],
  },
  {
    fullName: 'Rachel Green',
    email: 'rachel.green@fylapro.com',
    phoneNumber: '+1-555-0209',
    role: 'ServiceProvider',
    bio: 'Certified yoga instructor and meditation coach. Offers various yoga styles and mindfulness practices.',
    locationLat: 40.7549,
    locationLng: -73.984,
    specialties: [
      'Yoga Instruction',
      'Meditation',
      'Mindfulness',
      'Stress Relief',
    ],
    experience: '5+ years',
    certifications: ['RYT 200', 'Meditation Teacher Certification'],
  },
  {
    fullName: 'Antonio Lopez',
    email: 'antonio.lopez@fylapro.com',
    phoneNumber: '+1-555-0210',
    role: 'ServiceProvider',
    bio: 'Professional physical therapist specializing in injury recovery, mobility, and rehabilitation services.',
    locationLat: 40.7282,
    locationLng: -73.9942,
    specialties: [
      'Physical Therapy',
      'Injury Recovery',
      'Mobility',
      'Rehabilitation',
    ],
    experience: '12+ years',
    certifications: ['Licensed Physical Therapist', 'Sports Rehabilitation'],
  },
];

// Sample services for each provider type
const serviceTemplates = {
  Facials: [
    { name: 'Basic Facial', price: 75, duration: 60 },
    { name: 'Deep Cleansing Facial', price: 95, duration: 75 },
    { name: 'Anti-Aging Facial', price: 120, duration: 90 },
  ],
  Massage: [
    { name: 'Swedish Massage', price: 90, duration: 60 },
    { name: 'Deep Tissue Massage', price: 110, duration: 60 },
    { name: 'Sports Massage', price: 120, duration: 75 },
  ],
  Hair: [
    { name: 'Haircut & Style', price: 65, duration: 45 },
    { name: 'Color & Cut', price: 150, duration: 120 },
    { name: 'Highlights', price: 200, duration: 150 },
  ],
  Fitness: [
    { name: 'Personal Training Session', price: 80, duration: 60 },
    { name: 'Fitness Assessment', price: 60, duration: 45 },
    { name: 'Nutrition Consultation', price: 100, duration: 60 },
  ],
  Nails: [
    { name: 'Manicure', price: 35, duration: 30 },
    { name: 'Pedicure', price: 45, duration: 45 },
    { name: 'Gel Manicure', price: 55, duration: 45 },
  ],
  Barber: [
    { name: 'Haircut', price: 30, duration: 30 },
    { name: 'Beard Trim', price: 25, duration: 20 },
    { name: 'Full Service', price: 50, duration: 45 },
  ],
  Makeup: [
    { name: 'Event Makeup', price: 85, duration: 60 },
    { name: 'Bridal Makeup', price: 150, duration: 90 },
    { name: 'Makeup Lesson', price: 100, duration: 75 },
  ],
  Acupuncture: [
    { name: 'Initial Consultation', price: 120, duration: 75 },
    { name: 'Follow-up Treatment', price: 90, duration: 60 },
    { name: 'Pain Management', price: 110, duration: 60 },
  ],
  Yoga: [
    { name: 'Private Yoga Session', price: 85, duration: 60 },
    { name: 'Meditation Session', price: 60, duration: 45 },
    { name: 'Wellness Consultation', price: 75, duration: 60 },
  ],
  'Physical Therapy': [
    { name: 'Initial Assessment', price: 150, duration: 90 },
    { name: 'Physical Therapy Session', price: 120, duration: 60 },
    { name: 'Rehabilitation Program', price: 200, duration: 90 },
  ],
};

// Function to register a user
async function registerUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      fullName: userData.fullName,
      email: userData.email,
      password: DEFAULT_PASSWORD,
      confirmPassword: DEFAULT_PASSWORD,
      phoneNumber: userData.phoneNumber,
      role: userData.role,
    });

    console.log(`✅ Created ${userData.role}: ${userData.fullName}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to create ${userData.fullName}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

// Function to update user profile
async function updateUserProfile(userId, userData, token) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/${userId}`,
      {
        bio: userData.bio,
        locationLat: userData.locationLat,
        locationLng: userData.locationLng,
        profilePictureUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${userData.fullName.replace(
          ' ',
          ''
        )}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Updated profile for: ${userData.fullName}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to update profile for ${userData.fullName}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

// Function to add services for a provider
async function addProviderServices(providerId, specialties, token) {
  try {
    const servicesToAdd = [];

    specialties.forEach((specialty) => {
      if (serviceTemplates[specialty]) {
        servicesToAdd.push(...serviceTemplates[specialty]);
      }
    });

    // Add a few services for each provider
    const selectedServices = servicesToAdd.slice(0, 3);

    for (const service of selectedServices) {
      await axios.post(
        `${API_BASE_URL}/services`,
        {
          name: service.name,
          description: `Professional ${service.name.toLowerCase()} service`,
          price: service.price,
          estimatedDurationMinutes: service.duration,
          isActive: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    console.log(
      `✅ Added ${selectedServices.length} services for provider ${providerId}`
    );
  } catch (error) {
    console.error(
      `❌ Failed to add services for provider ${providerId}:`,
      error.response?.data || error.message
    );
  }
}

// Main function to seed all users
async function seedUsers() {
  console.log('🌱 Starting user seeding process...\n');

  // Create clients
  console.log('Creating clients...');
  for (const client of clients) {
    const result = await registerUser(client);
    if (result) {
      await updateUserProfile(result.user.id, client, result.token);
    }
    // Add a small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n');

  // Create service providers
  console.log('Creating service providers...');
  for (const provider of serviceProviders) {
    const result = await registerUser(provider);
    if (result) {
      await updateUserProfile(result.user.id, provider, result.token);
      // Add services for the provider
      await addProviderServices(
        result.user.id,
        provider.specialties,
        result.token
      );
    }
    // Add a small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n🎉 User seeding completed!');
  console.log('\nSummary:');
  console.log(`- Created ${clients.length} clients`);
  console.log(`- Created ${serviceProviders.length} service providers`);
  console.log(`- Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('\nUsers can now log in and start using the application!');
}

// Run the seeding process
if (require.main === module) {
  seedUsers().catch(console.error);
}

module.exports = { seedUsers, clients, serviceProviders };
