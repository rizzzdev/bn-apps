import { createApp, env } from "@app/index.js";
import { sentriAuth } from "@auth/index.js";

const app = createApp()
const port = env.PORT

app.listen(port, () => {
    sentriAuth.migrate()
    console.log(`server running on port ${port}.`)
})