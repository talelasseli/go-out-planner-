import { env } from "./shared/env.js";
import app from "./app.js";

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
