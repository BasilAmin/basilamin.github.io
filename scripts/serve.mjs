import { startServer } from "./server-core.mjs";

const port = Number(process.env.PORT || 4173);
startServer({ port });
