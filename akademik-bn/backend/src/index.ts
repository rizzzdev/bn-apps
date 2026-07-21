import { createServer } from '@/app/index';
import { env } from '@/configs/env';

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
