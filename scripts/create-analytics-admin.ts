import { createAdmin } from '../lib/analytics/auth';

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = arg('--email');
const password = process.env.ANALYTICS_ADMIN_PASSWORD;

if (!email) throw new Error('Usage: npm run analytics:create-admin -- --email admin@example.com');
if (!password || password.length < 12) throw new Error('ANALYTICS_ADMIN_PASSWORD must be at least 12 characters');

await createAdmin(email, password);
console.log(`Analytics admin ready: ${email.trim().toLowerCase()}`);
process.exit(0);
