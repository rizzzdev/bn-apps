import 'dotenv/config';

async function test() {
  const apiKey = process.env.API_KEY || 'master-data-bn-api-key';
  const masterApi = process.env.MASTER_API_URL || 'http://localhost:9091/api/v1';
  
  const modules = ['academic-years', 'majors', 'classes', 'teachers', 'students', 'subjects'];
  
  for (const mod of modules) {
    try {
      const response = await fetch(`${masterApi}/webhook/${mod}/sync`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      const payload = await response.json();
      console.log(mod, 'payload length:', payload?.data?.length);
    } catch (err: any) {
      console.error(mod, 'error:', err.message);
    }
  }
}
test();
