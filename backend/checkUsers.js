const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'FYLA.API', 'fyla.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT Id, Email, FullName, Role FROM Users LIMIT 20', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Users in database:');
    console.log('==================');
    rows.forEach((row) => {
      console.log(`${row.Id}: ${row.FullName} (${row.Email}) - ${row.Role}`);
    });

    const clients = rows.filter((r) => r.Role === 'Client');
    const providers = rows.filter(
      (r) => r.Role === 'Provider' || r.Role === 'ServiceProvider'
    );

    console.log(
      `\nSummary: ${clients.length} clients, ${providers.length} providers`
    );
  }
  db.close();
});
