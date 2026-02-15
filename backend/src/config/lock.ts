// src/config/lock.ts
import Redlock from 'redlock';
import redis from './redis'; // Your ioredis instance

export const createRedlock = () => {
  return new Redlock([redis], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
  });
};

// Create the redlock instance
export const redlock = createRedlock();