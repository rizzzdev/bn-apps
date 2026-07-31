import { createServer } from '@/app/index';
import { env } from '@/configs/env';
import { z } from 'zod';
import { customErrorMap } from '@/utils/zod-error-map';

z.setErrorMap(customErrorMap);

const app = createServer();

app.listen(env.PORT, async () => {
  const { sentriAuth } = await import('@/database/index.js');
  await sentriAuth.migrate();
  console.log(`Server is running on port ${env.PORT}`);
});
