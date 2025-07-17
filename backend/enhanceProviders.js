const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Database connection
const db = new sqlite3.Database('./FYLA.API/fyla.db');

// Comprehensive provider enhancements
const providerEnhancements = [
  {
    id: 5,
    name: 'Maria Garcia',
    specialty: 'Hair Stylist',
    bio: 'Professional hair stylist with 10+ years of experience. Specializing in color, cuts, and styling for all hair types. Licensed cosmetologist.',
    tags: ['Hair Stylist'],
    location: { lat: 40.7831, lng: -73.9712, city: 'New York, NY' }, // Manhattan
    services: [
      {
        name: "Women's Haircut & Style",
        description:
          'Professional haircut and styling for women. Includes wash, cut, and blow dry.',
        price: 75,
        duration: 90,
      },
      {
        name: 'Hair Color & Highlights',
        description:
          'Full color service or highlights. Includes consultation, application, and styling.',
        price: 150,
        duration: 180,
      },
      {
        name: "Men's Haircut",
        description: "Classic men's haircut with wash and style.",
        price: 45,
        duration: 45,
      },
      {
        name: 'Hair Treatment',
        description: 'Deep conditioning treatment for damaged or dry hair.',
        price: 60,
        duration: 60,
      },
      {
        name: 'Bridal Hair Styling',
        description: 'Special occasion and bridal hair styling services.',
        price: 120,
        duration: 120,
      },
    ],
  },
  {
    id: 6,
    name: 'Alex Thompson',
    specialty: 'Makeup Artist',
    bio: 'Certified makeup artist specializing in bridal, special events, and photoshoots. Available for on-location services.',
    tags: ['Makeup Artist'],
    location: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles, CA' }, // Hollywood
    services: [
      {
        name: 'Bridal Makeup',
        description:
          'Complete bridal makeup including trial session and wedding day application.',
        price: 200,
        duration: 120,
      },
      {
        name: 'Special Event Makeup',
        description:
          'Professional makeup for parties, galas, and special occasions.',
        price: 85,
        duration: 90,
      },
      {
        name: 'Photoshoot Makeup',
        description: 'Editorial and commercial photoshoot makeup services.',
        price: 150,
        duration: 90,
      },
      {
        name: 'Makeup Lesson',
        description: 'Personal makeup application lessons and techniques.',
        price: 100,
        duration: 60,
      },
      {
        name: 'Eyebrow Shaping',
        description: 'Professional eyebrow shaping and tinting services.',
        price: 45,
        duration: 30,
      },
    ],
  },
  {
    id: 7,
    name: 'Lisa Rodriguez',
    specialty: 'Nail Technician',
    bio: 'Licensed nail technician offering manicures, pedicures, gel nails, and creative nail art. Hygiene and quality are my priorities.',
    tags: ['Nail Technician'],
    location: { lat: 25.7617, lng: -80.1918, city: 'Miami, FL' }, // South Beach
    services: [
      {
        name: 'Classic Manicure',
        description:
          'Traditional manicure with nail shaping, cuticle care, and polish.',
        price: 35,
        duration: 45,
      },
      {
        name: 'Gel Manicure',
        description: 'Long-lasting gel polish manicure with UV curing.',
        price: 50,
        duration: 60,
      },
      {
        name: 'Pedicure',
        description:
          'Relaxing pedicure with foot soak, exfoliation, and polish.',
        price: 45,
        duration: 60,
      },
      {
        name: 'Nail Art Design',
        description: 'Custom nail art and creative designs.',
        price: 25,
        duration: 30,
      },
      {
        name: 'Acrylic Extensions',
        description: 'Full set of acrylic nail extensions with design.',
        price: 75,
        duration: 120,
      },
    ],
  },
  {
    id: 8,
    name: 'David Kim',
    specialty: 'Barber',
    bio: "Professional barber specializing in classic cuts, beard trimming, and men's grooming. Walk-ins welcome.",
    tags: ['Barber'],
    location: { lat: 41.8781, lng: -87.6298, city: 'Chicago, IL' }, // Downtown Chicago
    services: [
      {
        name: 'Classic Haircut',
        description: "Traditional men's haircut with wash and style.",
        price: 30,
        duration: 30,
      },
      {
        name: 'Beard Trim & Shape',
        description: 'Professional beard trimming and shaping service.',
        price: 25,
        duration: 30,
      },
      {
        name: 'Hot Towel Shave',
        description: 'Traditional hot towel straight razor shave.',
        price: 45,
        duration: 45,
      },
      {
        name: 'Haircut & Beard Combo',
        description: 'Complete haircut and beard grooming package.',
        price: 50,
        duration: 60,
      },
      {
        name: 'Hair Wash & Style',
        description: 'Professional hair washing and styling service.',
        price: 20,
        duration: 20,
      },
    ],
  },
  {
    id: 9,
    name: 'Jessica Taylor',
    specialty: 'Esthetician',
    bio: 'Licensed esthetician offering facials, chemical peels, and skincare consultations. Helping you achieve your best skin.',
    tags: ['Esthetician'],
    location: { lat: 47.6062, lng: -122.3321, city: 'Seattle, WA' }, // Downtown Seattle
    services: [
      {
        name: 'European Facial',
        description:
          'Deep cleansing facial with extractions and moisturizing treatment.',
        price: 80,
        duration: 90,
      },
      {
        name: 'Chemical Peel',
        description: 'Professional chemical peel for skin rejuvenation.',
        price: 120,
        duration: 60,
      },
      {
        name: 'Microdermabrasion',
        description:
          'Exfoliating treatment to improve skin texture and appearance.',
        price: 100,
        duration: 60,
      },
      {
        name: 'Acne Treatment',
        description: 'Specialized treatment for acne-prone skin.',
        price: 90,
        duration: 75,
      },
      {
        name: 'Anti-Aging Facial',
        description: 'Advanced anti-aging treatment with specialized serums.',
        price: 110,
        duration: 90,
      },
    ],
  },
  {
    id: 14,
    name: 'Test User2',
    specialty: 'Massage Therapist',
    bio: 'Certified massage therapist specializing in therapeutic and relaxation massage techniques.',
    tags: ['Massage Therapist'],
    location: { lat: 39.7392, lng: -104.9903, city: 'Denver, CO' }, // Downtown Denver
    services: [
      {
        name: 'Swedish Massage',
        description: 'Relaxing full-body Swedish massage for stress relief.',
        price: 90,
        duration: 60,
      },
      {
        name: 'Deep Tissue Massage',
        description: 'Therapeutic deep tissue massage for muscle tension.',
        price: 110,
        duration: 75,
      },
      {
        name: 'Hot Stone Massage',
        description: 'Soothing hot stone massage therapy.',
        price: 125,
        duration: 90,
      },
      {
        name: 'Sports Massage',
        description: 'Specialized massage for athletes and active individuals.',
        price: 100,
        duration: 60,
      },
      {
        name: 'Couples Massage',
        description: 'Relaxing massage experience for two people.',
        price: 200,
        duration: 60,
      },
    ],
  },
  {
    id: 17,
    name: 'Raffy Castle',
    specialty: 'Personal Trainer',
    bio: 'Certified personal trainer helping clients achieve their fitness goals through customized workout programs.',
    tags: ['Personal Trainer'],
    location: { lat: 30.2672, lng: -97.7431, city: 'Austin, TX' }, // Downtown Austin
    services: [
      {
        name: 'Personal Training Session',
        description:
          'One-on-one personal training session with customized workout.',
        price: 75,
        duration: 60,
      },
      {
        name: 'Group Fitness Class',
        description: 'Small group fitness class for 2-4 people.',
        price: 40,
        duration: 45,
      },
      {
        name: 'Fitness Assessment',
        description: 'Comprehensive fitness evaluation and goal setting.',
        price: 50,
        duration: 60,
      },
      {
        name: 'Nutrition Consultation',
        description: 'Personalized nutrition planning and dietary guidance.',
        price: 60,
        duration: 45,
      },
      {
        name: 'Workout Plan Design',
        description: 'Custom workout plan creation for home or gym.',
        price: 80,
        duration: 30,
      },
    ],
  },
  {
    id: 18,
    name: 'Rueben Ogbana',
    specialty: 'Photographer',
    bio: 'Professional photographer specializing in portraits, events, and commercial photography.',
    tags: ['Photographer'],
    location: { lat: 33.4484, lng: -112.074, city: 'Phoenix, AZ' }, // Downtown Phoenix
    services: [
      {
        name: 'Portrait Session',
        description: 'Professional portrait photography session with editing.',
        price: 200,
        duration: 120,
      },
      {
        name: 'Event Photography',
        description: 'Event and party photography services.',
        price: 300,
        duration: 240,
      },
      {
        name: 'Headshot Session',
        description: 'Professional headshots for business and social media.',
        price: 150,
        duration: 90,
      },
      {
        name: 'Family Photos',
        description: 'Family portrait session in studio or outdoor location.',
        price: 250,
        duration: 120,
      },
      {
        name: 'Product Photography',
        description: 'Commercial product photography for businesses.',
        price: 180,
        duration: 90,
      },
    ],
  },
  {
    id: 19,
    name: 'Issac Bien-Aime',
    specialty: 'Music Teacher',
    bio: 'Experienced music teacher offering lessons in piano, guitar, and music theory.',
    tags: ['Music Teacher'],
    location: { lat: 42.3601, lng: -71.0589, city: 'Boston, MA' }, // Back Bay
    services: [
      {
        name: 'Piano Lessons',
        description:
          'Private piano lessons for beginners to advanced students.',
        price: 60,
        duration: 60,
      },
      {
        name: 'Guitar Lessons',
        description: 'Acoustic and electric guitar instruction for all levels.',
        price: 55,
        duration: 60,
      },
      {
        name: 'Music Theory',
        description: 'Comprehensive music theory and composition lessons.',
        price: 50,
        duration: 45,
      },
      {
        name: 'Voice Lessons',
        description: 'Vocal coaching and singing technique instruction.',
        price: 65,
        duration: 60,
      },
      {
        name: 'Recording Session',
        description: 'Professional recording and music production guidance.',
        price: 100,
        duration: 120,
      },
    ],
  },
  {
    id: 21,
    name: 'Pila De Hambre',
    specialty: 'Dance Instructor',
    bio: 'Professional dance instructor teaching various styles including salsa, hip-hop, and contemporary.',
    tags: ['Dance Instructor'],
    location: { lat: 32.7767, lng: -96.797, city: 'Dallas, TX' }, // Downtown Dallas
    services: [
      {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction in your preferred style.',
        price: 70,
        duration: 60,
      },
      {
        name: "Couple's Dance Class",
        description: 'Partner dancing lessons for couples.',
        price: 80,
        duration: 60,
      },
      {
        name: 'Wedding Choreography',
        description: 'Custom choreography for wedding first dance.',
        price: 150,
        duration: 90,
      },
      {
        name: 'Group Dance Class',
        description: 'Fun group dance class for small groups.',
        price: 30,
        duration: 60,
      },
      {
        name: 'Dance Performance Prep',
        description:
          'Intensive training for dance performances and competitions.',
        price: 90,
        duration: 90,
      },
    ],
  },
];

// Additional providers for recently added ones
const newProviderEnhancements = [
  {
    id: 22,
    name: 'Fernando Martinez',
    specialty: 'Life Coach',
    bio: 'Certified life coach helping individuals achieve personal and professional goals through strategic planning and motivation.',
    tags: ['Life Coach'],
    location: { lat: 38.9072, lng: -77.0369, city: 'Washington, DC' }, // Downtown DC
    services: [
      {
        name: 'Life Coaching Session',
        description: 'One-on-one life coaching consultation and goal setting.',
        price: 100,
        duration: 90,
      },
      {
        name: 'Career Guidance',
        description: 'Professional career planning and development coaching.',
        price: 120,
        duration: 75,
      },
      {
        name: 'Relationship Coaching',
        description: 'Personal relationship and communication coaching.',
        price: 90,
        duration: 60,
      },
      {
        name: 'Stress Management',
        description:
          'Techniques and strategies for managing stress and anxiety.',
        price: 80,
        duration: 60,
      },
      {
        name: 'Goal Achievement Program',
        description: 'Structured program for achieving specific life goals.',
        price: 200,
        duration: 120,
      },
    ],
  },
  {
    id: 23,
    name: 'Fernando Martinez',
    specialty: 'Nutritionist',
    bio: 'Licensed nutritionist providing personalized meal planning and dietary consultations for optimal health.',
    tags: ['Nutritionist'],
    location: { lat: 35.2271, lng: -80.8431, city: 'Charlotte, NC' }, // Uptown Charlotte
    services: [
      {
        name: 'Nutrition Consultation',
        description: 'Comprehensive nutritional assessment and meal planning.',
        price: 85,
        duration: 90,
      },
      {
        name: 'Weight Loss Program',
        description: 'Personalized weight loss plan with ongoing support.',
        price: 150,
        duration: 60,
      },
      {
        name: 'Sports Nutrition',
        description:
          'Specialized nutrition planning for athletes and active individuals.',
        price: 100,
        duration: 75,
      },
      {
        name: 'Meal Prep Consultation',
        description: 'Guidance on healthy meal preparation and planning.',
        price: 70,
        duration: 60,
      },
      {
        name: 'Dietary Restriction Planning',
        description:
          'Specialized meal planning for food allergies and restrictions.',
        price: 90,
        duration: 75,
      },
    ],
  },
  {
    id: 24,
    name: 'Nando',
    specialty: 'Event Planner',
    bio: 'Creative event planner specializing in weddings, corporate events, and private celebrations.',
    tags: ['Event Planner'],
    location: { lat: 36.1627, lng: -86.7816, city: 'Nashville, TN' }, // Music City
    services: [
      {
        name: 'Event Planning Consultation',
        description: 'Initial consultation for event planning and design.',
        price: 150,
        duration: 120,
      },
      {
        name: 'Wedding Planning',
        description:
          'Comprehensive wedding planning and coordination services.',
        price: 2000,
        duration: 480,
      },
      {
        name: 'Corporate Event Planning',
        description: 'Professional corporate event planning and management.',
        price: 500,
        duration: 240,
      },
      {
        name: 'Party Planning',
        description: 'Private party and celebration planning services.',
        price: 300,
        duration: 180,
      },
      {
        name: 'Venue Selection',
        description: 'Assistance with venue selection and booking.',
        price: 100,
        duration: 90,
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

// Main function to enhance all providers
async function enhanceAllProviders() {
  console.log('🚀 Starting provider enhancement...');

  try {
    const allEnhancements = [
      ...providerEnhancements,
      ...newProviderEnhancements,
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

    console.log('\n🎉 All providers enhanced successfully!');
    console.log('\nSummary:');
    console.log(`- Updated ${allEnhancements.length} service providers`);
    console.log('- Added realistic locations across different US cities');
    console.log('- Assigned appropriate tags and specialties');
    console.log('- Created diverse service offerings for each provider');
    console.log('\nProviders now have:');
    console.log('- Hair stylists, makeup artists, nail technicians');
    console.log('- Barbers, estheticians, massage therapists');
    console.log('- Personal trainers, photographers, music teachers');
    console.log('- Dance instructors, life coaches, nutritionists');
    console.log('- Event planners with various services');
  } catch (error) {
    console.error('❌ Error enhancing providers:', error);
  } finally {
    db.close();
  }
}

// Run the enhancement
enhanceAllProviders();
