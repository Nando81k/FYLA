const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'FYLA.API', 'fyla.db');

console.log('🗨️ FYLA Chat Data Seeder');
console.log('========================');
console.log(`Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Sample conversations and messages to seed
const seedData = async () => {
  try {
    console.log('\n🔍 Checking existing users...');

    // Get some existing users to create conversations between
    const users = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT Id, Email, FullName, Role 
        FROM Users 
        WHERE Role IN ('Client', 'Provider')
        ORDER BY Role, Id
        LIMIT 10
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

    const clients = users.filter((u) => u.Role === 'Client');
    const providers = users.filter((u) => u.Role === 'Provider');

    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${providers.length} providers`);

    if (clients.length === 0 || providers.length === 0) {
      console.log(
        '❌ Need both clients and providers to create conversations.'
      );
      return;
    }

    // Clear existing conversations and messages for clean test
    console.log('\n🧹 Clearing existing chat data...');
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

    // Create conversations between clients and providers
    console.log('\n💬 Creating conversations...');

    const conversations = [
      {
        client: clients[0], // Emma Johnson
        provider: providers[0], // Sophia Grace (esthetician)
        messages: [
          {
            senderId: clients[0].Id,
            content:
              "Hi Sophia! I'm interested in booking a facial appointment. What times do you have available this week?",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          },
          {
            senderId: providers[0].Id,
            content:
              'Hello Emma! I have openings on Wednesday at 2 PM and Friday at 10 AM. Both are perfect for a hydrating facial treatment.',
            timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
          },
          {
            senderId: clients[0].Id,
            content:
              'Friday at 10 AM works perfectly! What should I do to prepare for the appointment?',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          },
          {
            senderId: providers[0].Id,
            content:
              "Great! Please arrive with a clean face (no makeup) and avoid any harsh scrubs 24 hours before. I'll take care of the rest! 😊",
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          },
        ],
      },
      {
        client: clients[1], // Michael Chen
        provider: providers[1], // Marcus Williams (massage therapist)
        messages: [
          {
            senderId: clients[1].Id,
            content:
              "Marcus, I've been having some tension in my shoulders from working out. Do you offer deep tissue massage?",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          },
          {
            senderId: providers[1].Id,
            content:
              'Absolutely! Deep tissue is one of my specialties. I can work on those tight spots and help with your recovery. When would you like to schedule?',
            timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
          },
          {
            senderId: clients[1].Id,
            content: 'Perfect! How about tomorrow evening after 6 PM?',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          },
        ],
      },
      {
        client: clients[2], // Sarah Martinez
        provider: providers[2], // Isabella Romano (hair stylist)
        messages: [
          {
            senderId: clients[2].Id,
            content:
              "Hi Isabella! I'm looking for a new hair color and style. I have an event coming up next month.",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          },
          {
            senderId: providers[2].Id,
            content:
              "I'd love to help! What's your current hair color and what look are you going for? I can suggest some gorgeous options that would work perfectly for your event.",
            timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago
          },
          {
            senderId: clients[2].Id,
            content:
              "I have dark brown hair right now. I'm thinking of going lighter, maybe some balayage highlights? The event is semi-formal.",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          },
          {
            senderId: providers[2].Id,
            content:
              "Balayage would look stunning on you! I can create some caramel and honey tones that would be perfect for a semi-formal event. Let's schedule a consultation first.",
            timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000), // 4.5 hours ago
          },
        ],
      },
      {
        client: clients[3], // David Thompson
        provider: providers[5], // Thomas Johnson (barber)
        messages: [
          {
            senderId: clients[3].Id,
            content:
              'Hi Thomas, I need a professional haircut and beard trim for some important business meetings next week.',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          },
          {
            senderId: providers[5].Id,
            content:
              'I can definitely help you look sharp for your meetings! I specialize in executive cuts and precise beard grooming. When works best for you?',
            timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000), // 7.5 hours ago
          },
        ],
      },
      {
        client: clients[4], // Jessica Lee
        provider: providers[4], // Maya Patel (nail technician)
        messages: [
          {
            senderId: clients[4].Id,
            content:
              "Hey Maya! I'm a college student on a budget. Do you have any affordable nail options? Maybe just a simple manicure?",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          },
          {
            senderId: providers[4].Id,
            content:
              'Of course! I offer student discounts and have basic manicure packages that are very affordable. We can keep it simple but still make your nails look great! 💅',
            timestamp: new Date(Date.now() - 11.5 * 60 * 60 * 1000), // 11.5 hours ago
          },
          {
            senderId: clients[4].Id,
            content:
              "That sounds perfect! What's included in the basic package?",
            timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000), // 11 hours ago
          },
        ],
      },
    ];

    // Insert conversations and messages
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];

      // Create conversation
      const conversationId = await new Promise((resolve, reject) => {
        db.run(
          `
          INSERT INTO Conversations (User1Id, User2Id, CreatedAt, UpdatedAt)
          VALUES (?, ?, ?, ?)
        `,
          [
            conv.client.Id,
            conv.provider.Id,
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
        `   ✅ Created conversation ${conversationId}: ${conv.client.FullName} ↔ ${conv.provider.FullName}`
      );

      // Add messages to conversation
      for (const message of conv.messages) {
        const receiverId =
          message.senderId === conv.client.Id
            ? conv.provider.Id
            : conv.client.Id;

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
              Math.random() > 0.5 ? 1 : 0, // Randomly mark some as read
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
      const lastMessage = conv.messages[conv.messages.length - 1];
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

      console.log(`   📝 Added ${conv.messages.length} messages`);
    }

    // Display summary
    console.log('\n📊 SUMMARY:');
    console.log('====================');
    console.log(`✅ Created ${conversations.length} conversations`);
    console.log(
      `✅ Added ${conversations.reduce(
        (total, conv) => total + conv.messages.length,
        0
      )} messages`
    );
    console.log('\n🎯 TEST USERS FOR CHAT:');
    console.log('========================');
    console.log('👤 CLIENTS:');
    clients.slice(0, 5).forEach((client) => {
      console.log(`   • ${client.FullName} (${client.Email})`);
    });
    console.log('\n🔧 PROVIDERS:');
    providers.slice(0, 5).forEach((provider) => {
      console.log(`   • ${provider.FullName} (${provider.Email})`);
    });

    console.log('\n🎉 Chat data seeding completed successfully!');
    console.log('You can now test real chat functionality in the app.');
  } catch (error) {
    console.error('❌ Error seeding chat data:', error);
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
