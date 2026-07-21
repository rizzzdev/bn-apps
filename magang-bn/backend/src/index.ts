import { createServer } from '@/app/index.js';
import { env } from '@/configs/env.js';
import { z } from 'zod';
import { customErrorMap } from '@/utils/zod-error-map.js';

// Set global custom error map untuk Zod
z.setErrorMap(customErrorMap);

const app = createServer();
app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
