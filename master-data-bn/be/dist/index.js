"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./app/index");
const env_1 = require("./configs/env");
const zod_1 = require("zod");
const zod_error_map_1 = require("./utils/zod-error-map");
zod_1.z.setErrorMap(zod_error_map_1.customErrorMap);
const app = (0, index_1.createServer)();
app.listen(env_1.env.PORT, async () => {
    const { sentriAuth } = await import('./database/index.js');
    await sentriAuth.migrate();
    console.log(`Server is running on port ${env_1.env.PORT}`);
});
