import { query } from './config/database';
import bcrypt from 'bcrypt';

async function test() {
  console.log("Querying database for user...");
  const res = await query('SELECT * FROM users WHERE email = $1', ['admin@acme.com']);
  const user = res.rows[0];
  if (!user) {
    console.error("FAIL: User admin@acme.com not found in database!");
    process.exit(1);
  }
  
  console.log("User retrieved from DB:", {
    email: user.email,
    password_hash: user.password_hash,
    is_active: user.is_active
  });
  
  const enteredPassword = "password123";
  console.log("Entered password:", enteredPassword);
  
  const isMatch = await bcrypt.compare(enteredPassword, user.password_hash);
  console.log("Bcrypt compare result:", isMatch);
  
  if (isMatch) {
    console.log("SUCCESS: Password matches!");
  } else {
    console.error("FAIL: Password does not match!");
  }
}

test().catch(console.error);
