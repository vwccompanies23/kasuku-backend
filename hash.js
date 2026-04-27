const bcrypt = require('bcrypt');

async function run() {
  const bcrypt = require('bcrypt');

bcrypt.hash('NewStrongPass123', 10).then(console.log);
}

run();