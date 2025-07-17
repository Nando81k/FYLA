const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'FYLA.API', 'fyla.db');

console.log('🗨️ FYLA Appointment & Chat Data Seeder');
console.log('======================================');
console.log(`Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Sample appointments and conversations to seed
const seedData = async () => {
  try {
    console.log('\n🔍 Checking existing users...');

    // Get some existing users to create appointments between
    const users = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT Id, Email, FullName, Role 
        FROM Users 
        WHERE Role IN ('Client', 'Provider', 'ServiceProvider', 'client', 'provider')
        ORDER BY Role, Id
        LIMIT 20
      `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run user seeding first.');
      return;
    }

    console.log(`✅ Found ${users.length} users`);

    // Debug: print all users and their roles
    console.log('\nUser roles found:');
    users.forEach((u) => console.log(`  ${u.FullName}: "${u.Role}"`));

    const clients = users.filter(
      (u) => u.Role === 'Client' || u.Role === 'client'
    );
    const providers = users.filter(
      (u) =>
        u.Role === 'Provider' ||
        u.Role === 'ServiceProvider' ||
        u.Role === 'provider'
    );

    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${providers.length} providers`);

    if (clients.length === 0 || providers.length === 0) {
      console.log('❌ Need both clients and providers to create appointments.');
      return;
    }

    // Get or create services for providers
    console.log('\n🔧 Checking services...');
    const services = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT s.Id, s.ProviderId, s.Name, s.Price, s.EstimatedDurationMinutes, u.FullName as ProviderName
        FROM Services s
        INNER JOIN Users u ON s.ProviderId = u.Id
        WHERE s.IsActive = 1
        LIMIT 10
      `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`✅ Found ${services.length} services`);

    // Create sample services if none exist
    if (services.length === 0) {
      console.log('📝 Creating sample services...');

      const sampleServices = [
        {
          providerId: providers[0]?.Id,
          name: 'Signature Facial',
          price: 85,
          duration: 60,
        },
        {
          providerId: providers[1]?.Id,
          name: 'Deep Tissue Massage',
          price: 120,
          duration: 90,
        },
        {
          providerId: providers[2]?.Id,
          name: 'Hair Cut & Style',
          price: 65,
          duration: 75,
        },
        {
          providerId: providers[3]?.Id,
          name: 'Personal Training',
          price: 80,
          duration: 60,
        },
        {
          providerId: providers[4]?.Id,
          name: 'Manicure & Pedicure',
          price: 55,
          duration: 90,
        },
      ];

      for (const service of sampleServices) {
        if (service.providerId) {
          await new Promise((resolve, reject) => {
            db.run(
              `
              INSERT INTO Services (ProviderId, Name, Description, Price, EstimatedDurationMinutes, IsActive, CreatedAt)
              VALUES (?, ?, ?, ?, ?, 1, ?)
            `,
              [
                service.providerId,
                service.name,
                `Professional ${service.name.toLowerCase()} service`,
                service.price,
                service.duration,
                new Date().toISOString(),
              ],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
        }
      }
      console.log(`✅ Created ${sampleServices.length} sample services`);
    }

    // Clear existing appointments, conversations and messages for clean test
    console.log('\n🧹 Clearing existing appointment and chat data...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM Messages', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM Conversations', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM AppointmentServices', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM Appointments', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get updated services list
    const availableServices = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT s.Id, s.ProviderId, s.Name, s.Price, s.EstimatedDurationMinutes, u.FullName as ProviderName
        FROM Services s
        INNER JOIN Users u ON s.ProviderId = u.Id
        WHERE s.IsActive = 1
        LIMIT 10
      `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Create realistic appointments with confirmed status
    console.log('\n📅 Creating sample appointments...');

    const appointments = [
      {
        client: clients[0], // Emma Johnson
        service: availableServices[0], // Facial with Sophia Grace
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'confirmed',
      },
      {
        client: clients[1], // Michael Chen
        service: availableServices[1], // Massage with Marcus Williams
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'confirmed',
      },
      {
        client: clients[2], // Sarah Martinez
        service: availableServices[2], // Hair with Isabella Romano
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'confirmed',
      },
      {
        client: clients[0], // Emma Johnson (repeat client)
        service: availableServices[1], // Different service
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
      },
    ];

    const createdAppointments = [];

    for (const apt of appointments) {
      if (apt.client && apt.service) {
        const startTime = new Date(apt.date);
        startTime.setHours(14, 0, 0, 0); // 2 PM

        const endTime = new Date(startTime);
        endTime.setMinutes(
          endTime.getMinutes() + apt.service.EstimatedDurationMinutes
        );

        // Create appointment
        const appointmentId = await new Promise((resolve, reject) => {
          db.run(
            `
            INSERT INTO Appointments (ClientId, ProviderId, ScheduledStartTime, ScheduledEndTime, Status, TotalPrice, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              apt.client.Id,
              apt.service.ProviderId,
              startTime.toISOString(),
              endTime.toISOString(),
              apt.status,
              apt.service.Price,
              new Date().toISOString(),
              new Date().toISOString(),
            ],
            function (err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        // Create appointment service link
        await new Promise((resolve, reject) => {
          db.run(
            `
            INSERT INTO AppointmentServices (AppointmentId, ServiceId, PriceAtBooking)
            VALUES (?, ?, ?)
          `,
            [appointmentId, apt.service.Id, apt.service.Price],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        createdAppointments.push({
          id: appointmentId,
          client: apt.client,
          provider: {
            Id: apt.service.ProviderId,
            FullName: apt.service.ProviderName,
          },
          service: apt.service,
          status: apt.status,
          startTime: startTime,
        });

        console.log(
          `   ✅ Created ${apt.status} appointment: ${apt.client.FullName} → ${apt.service.ProviderName} (${apt.service.Name})`
        );
      }
    }

    // Create conversations and messages for CONFIRMED appointments only
    console.log('\n💬 Creating conversations for confirmed appointments...');

    const confirmedAppointments = createdAppointments.filter(
      (apt) => apt.status === 'confirmed'
    );

    for (const apt of confirmedAppointments) {
      // Create conversation
      const conversationId = await new Promise((resolve, reject) => {
        db.run(
          `
          INSERT INTO Conversations (User1Id, User2Id, CreatedAt, UpdatedAt)
          VALUES (?, ?, ?, ?)
        `,
          [
            apt.client.Id,
            apt.provider.Id,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(
        `   ✅ Created conversation ${conversationId}: ${apt.client.FullName} ↔ ${apt.provider.FullName}`
      );

      // Create realistic messages for confirmed appointments
      const messages = [
        {
          senderId: apt.client.Id,
          content: `Hi! I'm looking forward to my ${apt.service.Name} appointment. Is there anything I should prepare beforehand?`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          senderId: apt.provider.Id,
          content: `Hello! Thank you for booking with me. Please arrive with clean skin (no makeup if it's a facial) and comfortable clothing. Looking forward to seeing you!`,
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        },
        {
          senderId: apt.client.Id,
          content: `Perfect! I'll make sure to follow those instructions. What's the best place to park when I arrive?`,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          senderId: apt.provider.Id,
          content: `There's free parking right in front of the building, or there's a parking garage next door if the street is full. See you soon! 😊`,
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      ];

      for (const message of messages) {
        const receiverId =
          message.senderId === apt.client.Id ? apt.provider.Id : apt.client.Id;

        await new Promise((resolve, reject) => {
          db.run(
            `
            INSERT INTO Messages (ConversationId, SenderId, ReceiverId, Content, IsRead, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
            [
              conversationId,
              message.senderId,
              receiverId,
              message.content,
              1, // Mark as read for demo
              message.timestamp.toISOString(),
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Update conversation timestamp to last message
      const lastMessage = messages[messages.length - 1];
      await new Promise((resolve, reject) => {
        db.run(
          `
          UPDATE Conversations 
          SET UpdatedAt = ? 
          WHERE Id = ?
        `,
          [lastMessage.timestamp.toISOString(), conversationId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log(`   📝 Added ${messages.length} messages`);
    }

    // Display summary
    console.log('\n📊 SUMMARY:');
    console.log('====================');
    console.log(`✅ Created ${createdAppointments.length} appointments`);
    console.log(
      `   - ${
        createdAppointments.filter((a) => a.status === 'confirmed').length
      } confirmed`
    );
    console.log(
      `   - ${
        createdAppointments.filter((a) => a.status === 'pending').length
      } pending`
    );
    console.log(`✅ Created ${confirmedAppointments.length} conversations`);
    console.log(`✅ Added messages for confirmed appointments`);

    console.log('\n🎯 TEST USERS FOR CHAT:');
    console.log('========================');
    console.log('👤 CLIENTS WITH CONFIRMED APPOINTMENTS:');
    confirmedAppointments.forEach((apt) => {
      console.log(
        `   • ${apt.client.FullName} (${apt.client.Email}) → ${apt.provider.FullName}`
      );
    });

    console.log('\n🎉 Appointment & Chat data seeding completed successfully!');
    console.log(
      'You can now test real chat functionality with confirmed appointments.'
    );
    console.log('\n📋 TESTING WORKFLOW:');
    console.log('1. Log in as a client with confirmed appointments');
    console.log('2. Go to "My Appointments" and click "Message Provider"');
    console.log('3. Chat with the provider about your upcoming appointment');
  } catch (error) {
    console.error('❌ Error seeding appointment & chat data:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
};

// Run the seeding
seedData();
