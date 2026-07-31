// Simulate full backend loading
import './src/configs/env.ts';

console.log('MASTER_DATABASE_URL:', (process.env.MASTER_DATABASE_URL || '').slice(0, 40));

// Now import the auth service
const { authService } = await import('./src/modules/auth/service/auth.service.ts');

try {
  const result = await authService.login('super@admin.com', 'superadmin123');
  console.log('Login success:', !!result.accessToken);
  console.log('User:', JSON.stringify(result.user, null, 2));
} catch(e) {
  console.error('Login failed:', e.message);
  console.error('Stack:', e.stack);
}

process.exit(0);
