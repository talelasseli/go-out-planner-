import { env } from "./shared/env.js";
import app from "./app.js";
import { safeError } from "./shared/logger.js";

process.on("unhandledRejection", (reason) => {
  safeError(reason, { source: "unhandledRejection" });
});

process.on("uncaughtException", (err) => {
  safeError(err, { source: "uncaughtException" });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
