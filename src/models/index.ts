import mongoose from 'mongoose';
import Redis from 'redis';
import {ServerConfig} from '../Server';
import Jwt from './jwt';
import Users from './rbac';

export default async function(config: ServerConfig,
                              db: mongoose.Mongoose,
                              redis: Redis.RedisClient) {
  return {
    jwt: await Jwt(redis),
    ...await Users(config, db),
  };
}
