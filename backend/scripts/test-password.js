const bcrypt = require('bcryptjs');

const hash = '$2b$10$fGpyMPsgp6DenD0Jv1LVluZSjSdEVrgsNyeHcXUFwZqqYlkaUMh2W';
const password = 'ecokart2025';

bcrypt.compare(password, hash).then(result => {
  console.log('Password match:', result);
  if (result) {
    console.log('✅ Password is correct!');
  } else {
    console.log('❌ Password does not match!');
  }
}).catch(err => {
  console.error('Error:', err);
});
