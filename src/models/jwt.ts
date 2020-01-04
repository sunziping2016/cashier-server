/**
 * This model is used to sign and revoke JWT. Traditional JWT is stateless.
 * Thus it cannot be default. We give every JWT an id and build an index in
 * Redis to make revoking JWT possible.
 *
 * @module src/models/jwt
 */
import cluster from 'cluster';
import crypto from 'crypto';
import jsonWebToken, {
  GetPublicKeyOrSecret,
  Secret,
  SignOptions,
  VerifyOptions,
} from 'jsonwebtoken';
// @ts-ignore
import timespan from 'jsonwebtoken/lib/timespan';
import redis from 'redis';
import { promisify } from 'util';
import logger from 'winston';
import {InitialGlobal} from '../Server';
import { randomAlnumString } from '../utils';

const jwtIdLength = 40;
const jwtSignAsync = promisify(jsonWebToken.sign) as (
  payload: string | Buffer | object,
  secretOrPrivateKey: Secret,
  options: SignOptions) => Promise<string>;
const jwtVerifyAsync = promisify(jsonWebToken.verify) as (
  token: string,
  secretOrPublicKey: Secret | GetPublicKeyOrSecret,
  options?: VerifyOptions) => Promise<object | string>;
const cryptoRandomBytesAsync = promisify(crypto.randomBytes);

// Promisify JSON web token
(['verify', 'sign'] as const).forEach((key) => {
  (jsonWebToken[key] as any) = promisify(jsonWebToken[key]);
});

// noinspection JSValidateJSDoc
/**
 * Throw when JWT is revoked.
 *
 * @extends jsonwebtoken.JsonWebTokenError
 */
class RevokedError extends jsonWebToken.JsonWebTokenError {
  constructor(message: string, error?: Error) {
    super(message, error);
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
    this.name = 'RevokedError';
  }
}

/**
 * JWT model，including following property:
 * - JsonWebTokenError: base class for all JWT errors, may be thrown when
 *   calling `verify`.
 * - NotBeforeError: not used.
 * - TokenExpiredError: JWT expired, may be thrown when calling `verify`.
 * - RevokedError: JWT revoked, may be thrown when calling `verify`.
 *
 * Available as `ctx.global.jwt`.
 */
export class Jwt {
  private client: redis.RedisClient;

  // noinspection JSValidateJSDoc
  /**
   * constructor of JWT model.
   * @param client {redis.RedisClient} redis client
   */
  constructor(client: redis.RedisClient) {
    this.client = client;

    Object.assign(this, {
      JsonWebTokenError: jsonWebToken.JsonWebTokenError,
      NotBeforeError: jsonWebToken.NotBeforeError,
      TokenExpiredError: jsonWebToken.TokenExpiredError,
      RevokedError,
    });
  }

  /**
   * Get `jwt:secretKey` from redis, return null if not exist.
   *
   * @return {Promise.<Buffer | null>} SecretKey
   */
  public async getSecretKey(): Promise<Buffer | null> {
    const result = await this.client.getAsync('jwt:secretKey');
    if (result)
      return Buffer.from(result);
    return null;
  }

  /**
   * Save `jwt:secretKey` to redis.
   *
   * @param secretKey {Buffer} 256 byte random string
   */
  public async setSecretKey(secretKey: Buffer): Promise<void> {
    await this.client.setAsync('jwt:secretKey', secretKey.toString());
  }

  /**
   * Sign JWT. Payload should contain `uid` and options should contain
   * `expiresIn`.
   *
   * @param payload {object} JWT payload.
   * @param options {object} see
   *        [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).
   * @return {Promise.<string>} generated JWT.
   */
  public async sign(payload: any,
                    options: jsonWebToken.SignOptions): Promise<string> {
    const timestamp = payload.iat = Math.floor(Date.now() / 1000);
    if (options.expiresIn !== undefined) {
      payload.exp = timespan(options.expiresIn, timestamp);
      delete options.expiresIn;
    }
    payload.jti = randomAlnumString(jwtIdLength);
    const secretKey = await this.getSecretKey();
    if (secretKey === null)
      throw new Error('Cannot get secret key');
    const jwt = await jwtSignAsync(payload, secretKey, options);
    if (payload.uid) {
      const userSet = 'jwt:uid:' + payload.uid;
      await this.client.zremrangebyscoreAsync(userSet, '-inf', timestamp);
      await this.client.zaddAsync(userSet, 'NX',
        payload.exp || '+inf', payload.jti);
    }
    return jwt;
  }

  /**
   * Verify JWT, return payload on success or throw error.
   *
   * @param token {string} JWT
   * @return {Promise.<object>} payload
   */
  public async verify(token: string) {
    const secretKey = await this.getSecretKey();
    if (secretKey === null)
      throw new Error('Cannot get secret key');
    const payload = await jwtVerifyAsync(token,
      secretKey) as {uid: string, jti: string};
    if (payload.uid) {
      const expire = await this.client.zscoreAsync('jwt:uid:' + payload.uid,
        payload.jti);
      if (expire === null)
        throw new RevokedError('jwt revoked');
    }
    return payload;
  }

  /**
   * Revoke one user's appointed or all JWT
   *
   * @param uid {string} user id
   * @param jti {string} optional，JWT id, revoke all JWT if omitted.
   * @return {Promise.<void>}
   */
  public async revoke(uid: string, jti?: string) {
    if (jti !== undefined) {
      await this.client.zremAsync('jwt:uid:' + uid, jti);
    } else {
      await this.client.delAsync('jwt:uid:' + uid);
    }
  }
}

export default async function(initialGlobal: InitialGlobal): Promise<Jwt> {
  const model = new Jwt(initialGlobal.redis);
  if (cluster.isMaster || cluster.worker.id === 1) {
    let secretKey = await model.getSecretKey();
    if (!secretKey) {
      secretKey = await cryptoRandomBytesAsync(256);
      await model.setSecretKey(secretKey);
      logger.warn('Generate new secret key');
    }
  }
  return model;
}
