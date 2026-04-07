import { rebuildPerformanceSummaries } from '../modules/performance/performance.repository.js';

rebuildPerformanceSummaries()
  .then(() => {
    console.log('[Performance] Summary rebuild complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Performance] Summary rebuild failed', err);
    process.exit(1);
  });
