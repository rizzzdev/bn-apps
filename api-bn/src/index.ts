import { createApp, env } from "#app";
import { sentriAuth } from "#auth";

const app = createApp()
const port = env.PORT

app.listen(port, () => {
    sentriAuth.migrate()
    console.log(`server running on port ${port}.`)
})