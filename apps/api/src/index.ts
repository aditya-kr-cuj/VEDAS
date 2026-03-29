import { env } from './config/env.js';
import { buildApp } from './app.js';

const app = buildApp();

app.listen(env.PORT, () => {
  // Keep startup log minimal and clear for beginner developers.
  console.log(`VEDAS API running on http://localhost:${env.PORT}`);
});
