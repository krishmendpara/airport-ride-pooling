
import Redlock from 'redlock';
import redis from './redis'; 

export const createRedlock = () => {
  return new Redlock([redis], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
  });
};


export const redlock = createRedlock();