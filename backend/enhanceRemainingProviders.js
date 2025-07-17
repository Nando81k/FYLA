const sqlite3 = require('sqlite3').verbose();

// Database connection
const db = new sqlite3.Database('./FYLA.API/fyla.db');

// Enhanced providers from the previously added list
const additionalProviderEnhancements = [
  {
    id: 35,
    name: 'Sophia Grace',
    specialty: 'Tutor',
    bio: 'Experienced academic tutor specializing in mathematics, science, and test preparation for students of all ages.',
    tags: ['Tutor'],
    location: { lat: 37.4419, lng: -122.143, city: 'Palo Alto, CA' }, // Silicon Valley
    services: [
      {
        name: 'Math Tutoring',
        description: 'Comprehensive math tutoring from algebra to calculus.',
        price: 60,
        duration: 60,
      },
      {
        name: 'Science Tutoring',
        description: 'Physics, chemistry, and biology tutoring for all levels.',
        price: 65,
        duration: 60,
      },
      {
        name: 'SAT/ACT Prep',
        description: 'Standardized test preparation and strategy sessions.',
        price: 80,
        duration: 90,
      },
      {
        name: 'Essay Writing Help',
        description: 'Academic writing and essay composition assistance.',
        price: 55,
        duration: 60,
      },
      {
        name: 'Study Skills Coaching',
        description: 'Learning strategies and study skills development.',
        price: 50,
        duration: 45,
      },
    ],
  },
  {
    id: 36,
    name: 'Marcus Williams',
    specialty: 'Art Teacher',
    bio: 'Professional artist and art instructor teaching drawing, painting, and digital art techniques.',
    tags: ['Art Teacher'],
    location: { lat: 39.9526, lng: -75.1652, city: 'Philadelphia, PA' }, // Center City
    services: [
      {
        name: 'Drawing Lessons',
        description:
          'Pencil, charcoal, and pen drawing instruction for all levels.',
        price: 70,
        duration: 90,
      },
      {
        name: 'Painting Classes',
        description: 'Acrylic, watercolor, and oil painting lessons.',
        price: 85,
        duration: 120,
      },
      {
        name: 'Digital Art Tutoring',
        description: 'Digital illustration and design software training.',
        price: 90,
        duration: 90,
      },
      {
        name: 'Portfolio Development',
        description:
          'Art portfolio creation for college or career applications.',
        price: 100,
        duration: 120,
      },
      {
        name: 'Art Therapy Session',
        description:
          'Therapeutic art sessions for stress relief and creativity.',
        price: 75,
        duration: 75,
      },
    ],
  },
  {
    id: 37,
    name: 'Isabella Romano',
    specialty: 'Hair Stylist',
    bio: 'High-end hair stylist specializing in European cutting techniques and luxury hair treatments.',
    tags: ['Hair Stylist'],
    location: { lat: 41.8781, lng: -87.6298, city: 'Chicago, IL' }, // Magnificent Mile
    services: [
      {
        name: 'Luxury Haircut & Style',
        description: 'Premium haircut service with European techniques.',
        price: 120,
        duration: 120,
      },
      {
        name: 'Balayage & Highlights',
        description: 'Hand-painted balayage and professional highlighting.',
        price: 250,
        duration: 240,
      },
      {
        name: 'Keratin Treatment',
        description: 'Professional keratin smoothing treatment.',
        price: 200,
        duration: 180,
      },
      {
        name: 'Hair Extensions',
        description: 'Professional hair extension application and styling.',
        price: 300,
        duration: 180,
      },
      {
        name: 'Special Occasion Styling',
        description: 'Elegant styling for weddings and special events.',
        price: 150,
        duration: 90,
      },
    ],
  },
  {
    id: 38,
    name: 'Alexander Smith',
    specialty: 'Massage Therapist',
    bio: 'Licensed massage therapist specializing in therapeutic massage and pain management techniques.',
    tags: ['Massage Therapist'],
    location: { lat: 45.5152, lng: -122.6784, city: 'Portland, OR' }, // Downtown Portland
    services: [
      {
        name: 'Therapeutic Massage',
        description: 'Medical massage therapy for pain relief and healing.',
        price: 120,
        duration: 90,
      },
      {
        name: 'Prenatal Massage',
        description: 'Specialized massage therapy for expectant mothers.',
        price: 100,
        duration: 75,
      },
      {
        name: 'Lymphatic Drainage',
        description: 'Gentle massage to stimulate lymphatic system.',
        price: 110,
        duration: 60,
      },
      {
        name: 'Myofascial Release',
        description: 'Specialized technique for muscle and fascia treatment.',
        price: 130,
        duration: 75,
      },
      {
        name: 'Aromatherapy Massage',
        description: 'Relaxing massage with therapeutic essential oils.',
        price: 95,
        duration: 60,
      },
    ],
  },
  {
    id: 39,
    name: 'Maya Patel',
    specialty: 'Makeup Artist',
    bio: 'Celebrity makeup artist with expertise in high-fashion and editorial makeup artistry.',
    tags: ['Makeup Artist'],
    location: { lat: 40.7589, lng: -73.9851, city: 'New York, NY' }, // Times Square
    services: [
      {
        name: 'Editorial Makeup',
        description: 'High-fashion editorial and runway makeup artistry.',
        price: 300,
        duration: 150,
      },
      {
        name: 'Red Carpet Makeup',
        description: 'Glamorous makeup for premieres and special events.',
        price: 250,
        duration: 120,
      },
      {
        name: 'Airbrush Makeup',
        description:
          'Flawless airbrush makeup application for special occasions.',
        price: 180,
        duration: 90,
      },
      {
        name: 'Makeup Masterclass',
        description: 'Advanced makeup techniques and artistry workshop.',
        price: 200,
        duration: 180,
      },
      {
        name: 'Celebrity Styling',
        description:
          'Complete styling service including makeup and hair consultation.',
        price: 500,
        duration: 240,
      },
    ],
  },
  {
    id: 40,
    name: 'Thomas Johnson',
    specialty: 'Personal Trainer',
    bio: 'Elite personal trainer and strength coach working with professional athletes and fitness enthusiasts.',
    tags: ['Personal Trainer'],
    location: { lat: 33.749, lng: -84.388, city: 'Atlanta, GA' }, // Downtown Atlanta
    services: [
      {
        name: 'Elite Training Session',
        description: 'High-intensity training session for advanced athletes.',
        price: 150,
        duration: 90,
      },
      {
        name: 'Strength Coaching',
        description: 'Specialized strength and powerlifting coaching.',
        price: 120,
        duration: 75,
      },
      {
        name: 'Athletic Performance',
        description: 'Sport-specific training for competitive athletes.',
        price: 140,
        duration: 90,
      },
      {
        name: 'Body Transformation',
        description: 'Comprehensive fitness and body composition program.',
        price: 100,
        duration: 60,
      },
      {
        name: 'Injury Rehabilitation',
        description: 'Specialized training for injury recovery and prevention.',
        price: 130,
        duration: 75,
      },
    ],
  },
  {
    id: 41,
    name: 'Chloe Davis',
    specialty: 'Esthetician',
    bio: 'Advanced esthetician specializing in medical-grade skincare treatments and anti-aging procedures.',
    tags: ['Esthetician'],
    location: { lat: 36.1627, lng: -86.7816, city: 'Nashville, TN' }, // Music Row
    services: [
      {
        name: 'HydraFacial Treatment',
        description: 'Advanced hydrating and exfoliating facial treatment.',
        price: 150,
        duration: 75,
      },
      {
        name: 'Microneedling',
        description: 'Collagen induction therapy for skin rejuvenation.',
        price: 200,
        duration: 90,
      },
      {
        name: 'LED Light Therapy',
        description: 'Therapeutic LED treatment for various skin concerns.',
        price: 80,
        duration: 45,
      },
      {
        name: 'Oxygen Infusion Facial',
        description: 'Rejuvenating oxygen therapy for glowing skin.',
        price: 120,
        duration: 60,
      },
      {
        name: 'Custom Skincare Consultation',
        description:
          'Personalized skincare routine and product recommendations.',
        price: 75,
        duration: 60,
      },
    ],
  },
];

// Additional recently added providers (from the addMoreProviders script)
const recentProviderEnhancements = [
  {
    id: 55,
    name: 'Harper Davis',
    specialty: 'Hair Stylist',
    bio: 'Color specialist and hair designer. Expert in balayage, highlights, and creative color transformations.',
    tags: ['Hair Stylist'],
    location: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX' }, // Downtown Houston
    services: [
      {
        name: 'Color Transformation',
        description: 'Complete hair color makeover with advanced techniques.',
        price: 180,
        duration: 210,
      },
      {
        name: 'Balayage Specialist',
        description: 'Hand-painted balayage for natural-looking highlights.',
        price: 160,
        duration: 180,
      },
      {
        name: 'Creative Color Design',
        description: 'Artistic hair coloring with unique color combinations.',
        price: 200,
        duration: 240,
      },
      {
        name: 'Color Correction',
        description: 'Professional color correction and repair services.',
        price: 220,
        duration: 270,
      },
      {
        name: 'Gloss & Toner',
        description: 'Hair gloss and toning service for color enhancement.',
        price: 80,
        duration: 60,
      },
    ],
  },
  {
    id: 56,
    name: 'Elena Rodriguez',
    specialty: 'Massage Therapist',
    bio: 'Holistic massage therapist integrating Eastern and Western techniques for complete wellness.',
    tags: ['Massage Therapist'],
    location: { lat: 32.7157, lng: -117.1611, city: 'San Diego, CA' }, // Gaslamp Quarter
    services: [
      {
        name: 'Holistic Massage',
        description:
          'Integrative massage combining multiple therapeutic techniques.',
        price: 110,
        duration: 90,
      },
      {
        name: 'Reiki Energy Healing',
        description:
          'Japanese energy healing technique for balance and wellness.',
        price: 85,
        duration: 60,
      },
      {
        name: 'Reflexology',
        description: 'Therapeutic foot massage targeting pressure points.',
        price: 70,
        duration: 45,
      },
      {
        name: 'Craniosacral Therapy',
        description: 'Gentle treatment for the central nervous system.',
        price: 120,
        duration: 75,
      },
      {
        name: 'Wellness Consultation',
        description:
          'Comprehensive wellness assessment and treatment planning.',
        price: 90,
        duration: 60,
      },
    ],
  },
  {
    id: 57,
    name: 'Marcus Thompson',
    specialty: 'Personal Trainer',
    bio: 'Specialized fitness trainer focusing on functional movement and corrective exercise programs.',
    tags: ['Personal Trainer'],
    location: { lat: 44.9778, lng: -93.265, city: 'Minneapolis, MN' }, // Downtown Minneapolis
    services: [
      {
        name: 'Functional Movement',
        description: 'Training focused on real-world movement patterns.',
        price: 85,
        duration: 60,
      },
      {
        name: 'Corrective Exercise',
        description: 'Specialized exercises to address muscle imbalances.',
        price: 95,
        duration: 75,
      },
      {
        name: 'Senior Fitness',
        description: 'Safe and effective fitness programs for older adults.',
        price: 70,
        duration: 45,
      },
      {
        name: 'Post-Rehab Training',
        description: 'Fitness training following physical therapy completion.',
        price: 100,
        duration: 60,
      },
      {
        name: 'Movement Assessment',
        description: 'Comprehensive movement screening and analysis.',
        price: 80,
        duration: 60,
      },
    ],
  },
];

// Function to get tag ID by name
function getTagId(tagName) {
  const tagMap = {
    'Hair Stylist': 1,
    'Makeup Artist': 2,
    'Nail Technician': 3,
    Barber: 4,
    Esthetician: 5,
    'Massage Therapist': 6,
    'Personal Trainer': 7,
    Photographer: 8,
    'Event Planner': 9,
    Tutor: 10,
    'Music Teacher': 11,
    'Art Teacher': 12,
    'Dance Instructor': 13,
    'Life Coach': 14,
    Nutritionist: 15,
  };
  return tagMap[tagName] || 1;
}

// Function to update provider information
function updateProvider(provider) {
  return new Promise((resolve, reject) => {
    const updateQuery = `
      UPDATE Users 
      SET Bio = ?, LocationLat = ?, LocationLng = ?
      WHERE Id = ?
    `;

    db.run(
      updateQuery,
      [provider.bio, provider.location.lat, provider.location.lng, provider.id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          console.log(
            `✅ Updated provider ${provider.name} with location: ${provider.location.city}`
          );
          resolve();
        }
      }
    );
  });
}

// Function to add provider tags
function addProviderTags(providerId, tags) {
  return new Promise((resolve, reject) => {
    // First, remove existing tags for this provider
    db.run(
      'DELETE FROM UserServiceProviderTags WHERE UserId = ?',
      [providerId],
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Add new tags
        const promises = tags.map((tagName) => {
          return new Promise((res, rej) => {
            const tagId = getTagId(tagName);
            db.run(
              'INSERT INTO UserServiceProviderTags (UserId, ServiceProviderTagId) VALUES (?, ?)',
              [providerId, tagId],
              function (err) {
                if (err) rej(err);
                else res();
              }
            );
          });
        });

        Promise.all(promises)
          .then(() => {
            console.log(
              `🏷️  Added tags for provider ${providerId}: ${tags.join(', ')}`
            );
            resolve();
          })
          .catch(reject);
      }
    );
  });
}

// Function to add services for a provider
function addProviderServices(providerId, services) {
  return new Promise((resolve, reject) => {
    // First, deactivate existing services for this provider
    db.run(
      'UPDATE Services SET IsActive = 0 WHERE ProviderId = ?',
      [providerId],
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Add new services
        const promises = services.map((service) => {
          return new Promise((res, rej) => {
            db.run(
              `INSERT INTO Services (ProviderId, Name, Description, Price, EstimatedDurationMinutes, IsActive, CreatedAt) 
             VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
              [
                providerId,
                service.name,
                service.description,
                service.price,
                service.duration,
              ],
              function (err) {
                if (err) rej(err);
                else res();
              }
            );
          });
        });

        Promise.all(promises)
          .then(() => {
            console.log(
              `🔧 Added ${services.length} services for provider ${providerId}`
            );
            resolve();
          })
          .catch(reject);
      }
    );
  });
}

// Main function to enhance remaining providers
async function enhanceRemainingProviders() {
  console.log('🚀 Starting enhancement for remaining providers...');

  try {
    const allEnhancements = [
      ...additionalProviderEnhancements,
      ...recentProviderEnhancements,
    ];

    for (const provider of allEnhancements) {
      console.log(`\n📋 Processing ${provider.name}...`);

      // Update provider info
      await updateProvider(provider);

      // Add tags
      await addProviderTags(provider.id, provider.tags);

      // Add services
      await addProviderServices(provider.id, provider.services);

      console.log(`✨ Completed enhancement for ${provider.name}`);
    }

    console.log('\n🎉 All remaining providers enhanced successfully!');
    console.log('\nAdditional Summary:');
    console.log(`- Updated ${allEnhancements.length} more service providers`);
    console.log('- Added more cities across the US');
    console.log('- Enhanced specialization diversity');
    console.log('- Created premium and specialized service offerings');
  } catch (error) {
    console.error('❌ Error enhancing providers:', error);
  } finally {
    db.close();
  }
}

// Run the enhancement
enhanceRemainingProviders();
