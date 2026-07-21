import 'dotenv/config';
import { app } from './src/app';
const port = 9062;
app.listen(port, async () => {
  console.log('Test server on', port);
  const response = await fetch(`http://localhost:${port}/api/v1/webhook/sync-all`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.API_KEY || 'master-data-bn-api-key' }
  });
  console.log(await response.json());
  process.exit(0);
});
