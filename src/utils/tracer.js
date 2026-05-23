import crypto from 'crypto';

export const tracer = {
  generateTraceId: () => {
    return crypto.randomBytes(16).toString('hex');
  }
};