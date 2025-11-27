const bcrypt = require('bcrypt');

async function run() {
  const password = 'test123';            // plain password you want for admin
  const hash = await bcrypt.hash(password, 10);  // 10 salt rounds
  console.log(hash);
}

run();
