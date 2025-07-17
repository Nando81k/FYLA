const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'FYLA.API', 'fyla.db');

// Additional service providers to add
const newProviders = [
  {
    fullName: 'Elena Rodriguez',
    email: 'elena.rodriguez@beauty.com',
    phoneNumber: '+1-555-0101',
    bio: 'Certified esthetician specializing in facials, chemical peels, and skincare treatments. 10+ years of experience helping clients achieve healthy, glowing skin.',
    locationLat: 40.7831,
    locationLng: -73.9712,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1594824663-8b5f0b4897c5?w=200',
  },
  {
    fullName: 'Marcus Thompson',
    email: 'marcus.thompson@massage.com',
    phoneNumber: '+1-555-0102',
    bio: 'Licensed massage therapist offering deep tissue, Swedish, and sports massage. Certified in cupping and hot stone therapy.',
    locationLat: 40.7505,
    locationLng: -73.9934,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    fullName: 'Zoe Chen',
    email: 'zoe.chen@nails.com',
    phoneNumber: '+1-555-0103',
    bio: "Award-winning nail artist specializing in gel extensions, nail art, and luxury manicures. Featured in Vogue and Harper's Bazaar.",
    locationLat: 40.7282,
    locationLng: -74.0776,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  },
  {
    fullName: 'Tyler Brooks',
    email: 'tyler.brooks@barber.com',
    phoneNumber: '+1-555-0104',
    bio: 'Master barber with 15 years experience. Specializing in fades, beard trimming, and traditional hot towel shaves.',
    locationLat: 40.7614,
    locationLng: -73.9776,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  },
  {
    fullName: 'Aria Patel',
    email: 'aria.patel@wellness.com',
    phoneNumber: '+1-555-0105',
    bio: 'Holistic wellness practitioner offering yoga instruction, meditation guidance, and wellness coaching for mind-body balance.',
    locationLat: 40.7589,
    locationLng: -73.9851,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
  },
  {
    fullName: 'Cameron Foster',
    email: 'cameron.foster@fitness.com',
    phoneNumber: '+1-555-0106',
    bio: 'Certified personal trainer and nutrition coach. Specializing in strength training, weight loss, and athletic performance.',
    locationLat: 40.74,
    locationLng: -74.0,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    fullName: 'Luna Martinez',
    email: 'luna.martinez@lashes.com',
    phoneNumber: '+1-555-0107',
    bio: 'Expert lash technician specializing in volume lashes, classic extensions, and lash lifts. Over 5 years of experience.',
    locationLat: 40.7687,
    locationLng: -73.979,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=200',
  },
  {
    fullName: 'River Johnson',
    email: 'river.johnson@therapy.com',
    phoneNumber: '+1-555-0108',
    bio: 'Licensed physical therapist helping clients recover from injuries and improve mobility through personalized treatment plans.',
    locationLat: 40.735,
    locationLng: -74.003,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  {
    fullName: 'Sage Williams',
    email: 'sage.williams@makeup.com',
    phoneNumber: '+1-555-0109',
    bio: 'Professional makeup artist for weddings, special events, and photo shoots. Trained in both natural and glam looks.',
    locationLat: 40.7505,
    locationLng: -73.9934,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    fullName: 'Kai Anderson',
    email: 'kai.anderson@tattoo.com',
    phoneNumber: '+1-555-0110',
    bio: 'Professional tattoo artist specializing in fine line work, geometric designs, and custom pieces. 8+ years experience.',
    locationLat: 40.7282,
    locationLng: -74.0776,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    fullName: 'Harper Davis',
    email: 'harper.davis@hair.com',
    phoneNumber: '+1-555-0111',
    bio: 'Color specialist and hair designer. Expert in balayage, highlights, and creative color transformations.',
    locationLat: 40.7831,
    locationLng: -73.9712,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
  },
  {
    fullName: 'Phoenix Lee',
    email: 'phoenix.lee@reiki.com',
    phoneNumber: '+1-555-0112',
    bio: 'Certified Reiki master and energy healer. Offering healing sessions for stress relief, emotional balance, and spiritual wellness.',
    locationLat: 40.7614,
    locationLng: -73.9776,
    profilePictureUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  },
];

async function addProviders() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('FYLATest2024!', salt);

    const stmt = db.prepare(`
      INSERT INTO Users (
        FullName, Email, PhoneNumber, PasswordHash, Role, Bio, 
        LocationLat, LocationLng, ProfilePictureUrl, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let completed = 0;
    const total = newProviders.length;

    newProviders.forEach((provider, index) => {
      const now = new Date().toISOString();

      stmt.run(
        [
          provider.fullName,
          provider.email,
          provider.phoneNumber,
          hashedPassword,
          'ServiceProvider',
          provider.bio,
          provider.locationLat,
          provider.locationLng,
          provider.profilePictureUrl,
          now,
          now,
        ],
        function (err) {
          if (err) {
            console.error(
              `Error inserting provider ${provider.fullName}:`,
              err
            );
          } else {
            console.log(
              `✅ Added provider: ${provider.fullName} (ID: ${this.lastID})`
            );
          }

          completed++;
          if (completed === total) {
            stmt.finalize();
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
                reject(err);
              } else {
                console.log(
                  `\n🎉 Successfully added ${total} new service providers!`
                );
                resolve();
              }
            });
          }
        }
      );
    });
  });
}

// Run the script
addProviders()
  .then(() => {
    console.log('✨ All providers added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error adding providers:', error);
    process.exit(1);
  });
