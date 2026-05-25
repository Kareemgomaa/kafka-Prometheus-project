import { metricsTracker } from '../../prometheus/prometheus.client.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const traceMiddleware = async (req, res, next) => {
  if (req.url === '/metrics') {
    return next();
  }

  const incomingTraceId = req.headers['x-trace-id'];
  const traceId = incomingTraceId || Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18);
  
  req.traceId = traceId;
  const startTime = process.hrtime();
  
  console.log(`\n======================================================`);
  console.log(`[STAGE 1] Request entered Server: ${req.method} ${req.url}`);
  console.log(incomingTraceId ? `[Trace ID Propagated]: ${req.traceId}` : `[Trace ID Generated]: ${req.traceId}`);
  console.log(` Waiting 3 seconds in Middleware...`);
  console.log(`======================================================`);

  await delay(3000);

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    console.log(`[STAGE 4] Request finished | Total Time: ${durationInMs}ms`);

    metricsTracker.incHttpRequests(
      req.method,
      req.route ? req.route.path : req.url,
      res.statusCode
    );
  });

  next();
};