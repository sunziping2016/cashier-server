/* tslint:disable:member-ordering */
import * as redis from 'redis';

declare module 'redis' {

  export interface OverloadedCommandAsync<T, U, R> {
    (arg1: T, arg2: T, arg3: T, arg4?: T, arg5?: T, arg6?: T): Promise<U>;
    (arg1: T, arg2: T | T[]): Promise<U>;
    (arg1: T | T[]): Promise<U>;
    (...args: T[]): Promise<U>;
  }

  export interface OverloadedKeyCommandAsync<T, U, R> {
    (key: string, arg1: T, arg2: T, arg3?: T, arg4?: T, arg5?: T, arg6?: T)
      : Promise<U>;
    (key: string, arg1: T | T[]): Promise<U>;
    (key: string, ...args: T[]): Promise<U>;
    (...args: Array<string | T>): Promise<U>;
  }

  export interface OverloadedListCommandAsync<T, U, R> {
    (arg1: T, arg2: T, arg3?: T, arg4?: T, arg5?: T, arg6?: T): Promise<U>;
    (arg1: T | T[]): Promise<U>;
    (...args: T[]): Promise<U>;
  }

  export interface OverloadedSetCommandAsync<T, U, R> {
    (key: string, arg1: T, arg2: T, arg3?: T, arg4?: T, arg5?: T, arg6?: T)
      : Promise<U>;
    (key: string, arg1: T | { [key: string]: T } | T[]): Promise<U>;
    (key: string, ...args: T[]): Promise<U>;
  }

  export interface OverloadedLastCommandAsync<T1, T2, U, R> {
    (arg1: T1, arg2: T1, arg3: T1, arg4: T1, arg5: T1, arg6: T2): Promise<U>;
    (arg1: T1, arg2: T1, arg3: T1, arg4: T1, arg5: T2): Promise<U>;
    (arg1: T1, arg2: T1, arg3: T1, arg4: T2): Promise<U>;
    (arg1: T1, arg2: T1, arg3: T2): Promise<U>;
    (arg1: T1, arg2: T2 | Array<T1 | T2>): Promise<U>;
    (args: Array<T1 | T2>): Promise<U>;
    (...args: Array<T1 | T2>): Promise<U>;
  }

  export interface Commands<R> {
    monitorAsync(): Promise<undefined>;
    infoAsync(section?: string | string[]): Promise<ServerInfo>;
    pingAsync(message?: string): Promise<string>;
    publishAsync(channel: string, value: string): Promise<number>;
    authAsync(password: string): Promise<string>;
    clientAsync: OverloadedCommandAsync<string, any, R>;
    hmsetAsync: OverloadedSetCommandAsync<string | number, 'OK', R>;
    subscribeAsync: OverloadedListCommandAsync<string, string, R>;
    unsubscribeAsync: OverloadedListCommandAsync<string, string, R>;
    psubscribeAsync: OverloadedListCommandAsync<string, string, R>;
    punsubscribeAsync: OverloadedListCommandAsync<string, string, R>;
    appendAsync(key: string, value: string): Promise<number>;
    bgrewriteaofAsync(): Promise<'OK'>;
    bgsaveAsync(): Promise<string>;
    bitcountAsync(key: string): Promise<number>;
    bitcountAsync(key: string, start: number, end: number): Promise<number>;
    bitfieldAsync:
      OverloadedKeyCommandAsync<string | number, [number, number], R>;
    bitopAsync(operation: string, destkey: string, key1: string, key2?: string,
               key3?: string): Promise<number>;
    bitopAsync(operation: string, destkey: string, ...args: string[])
      : Promise<number>;
    bitposAsync(key: string, bit: number, start?: number, end?: number)
      : Promise<number>;
    blpopAsync: OverloadedLastCommandAsync<string, number, [string, string], R>;
    brpopAsync: OverloadedLastCommandAsync<string, number, [string, string], R>;
    brpoplpushAsync(source: string, destination: string, timeout: number)
      : Promise<string | null>;
    clusterAsync: OverloadedCommandAsync<string, any, this>;
    commandAsync()
      : Promise<Array<[string, number, string[], number, number, number]>>;
    configAsync: OverloadedCommandAsync<string, boolean, R>;
    dbsizeAsync(): Promise<number>;
    debugAsync: OverloadedCommandAsync<string, boolean, R>;
    decrAsync(key: string): Promise<number>;
    decrbyAsync(key: string, decrement: number): Promise<number>;
    delAsync: OverloadedCommandAsync<string, number, R>;
    discardAsync(): Promise<'OK'>;
    dumpAsync(key: string): Promise<string>;
    echoAsync<T extends string>(message: T): Promise<T>;
    evalAsync: OverloadedCommandAsync<string | number, any, R>;
    evalshaAsync: OverloadedCommandAsync<string | number, any, R>;
    existsAsync: OverloadedCommandAsync<string, number, R>;
    expireAsync(key: string, seconds: number): Promise<number>;
    expireatAsync(key: string, timestamp: number): Promise<number>;
    flushallAsync(async?: 'ASYNC'): Promise<string>;
    flushdbAsync(async?: 'ASYNC'): Promise<string>;
    geoaddAsync: OverloadedKeyCommandAsync<string | number, number, R>;
    geohashAsync: OverloadedKeyCommandAsync<string, string, R>;
    geoposAsync: OverloadedKeyCommandAsync<string, Array<[number, number]>, R>;
    geodistAsync: OverloadedKeyCommandAsync<string, string, R>;
    georadiusAsync: OverloadedKeyCommandAsync<string | number,
      Array<string | [string, string | [string, string]]>, R>;
    georadiusbymemberAsync: OverloadedKeyCommandAsync<string | number,
      Array<string | [string, string | [string, string]]>, R>;
    getAsync(key: string): Promise<string>;
    getbitAsync(key: string, offset: number): Promise<number>;
    getrangeAsync(key: string, start: number, end: number): Promise<string>;
    getsetAsync(key: string, value: string): Promise<string>;
    hdelAsync: OverloadedKeyCommandAsync<string, number, R>;
    hexistsAsync(key: string, field: string): Promise<number>;
    hgetAsync(key: string, field: string): Promise<string>;
    hgetallAsync(key: string): Promise<{ [key: string]: string }>;
    hincrbyAsync(key: string, field: string, increment: number)
      : Promise<number>;
    hincrbyfloatAsync(key: string, field: string, increment: number)
      : Promise<string>;
    hkeysAsync(key: string): Promise<string[]>;
    hlenAsync(key: string): Promise<number>;
    hmgetAsync: OverloadedKeyCommandAsync<string, string[], R>;
    hsetAsync(key: string, field: string, value: string): Promise<number>;
    hsetnxAsync(key: string, field: string, value: string): Promise<number>;
    hstrlenAsync(key: string, field: string): Promise<number>;
    hvalsAsync(key: string): Promise<string[]>;
    incrAsync(key: string): Promise<number>;
    incrbyAsync(key: string, increment: number): Promise<number>;
    incrbyfloatAsync(key: string, increment: number): Promise<string>;
    keysAsync(pattern: string): Promise<string[]>;
    lastsaveAsync(): Promise<number>;
    lindexAsync(key: string, index: number): Promise<string>;
    linsertAsync(key: string, dir: 'BEFORE' | 'AFTER', pivot: string,
                 value: string): Promise<string>;
    llenAsync(key: string): Promise<number>;
    lpopAsync(key: string): Promise<string>;
    lpushAsync: OverloadedKeyCommandAsync<string, number, R>;
    lpushxAsync(key: string, value: string): Promise<number>;
    lrangeAsync(key: string, start: number, stop: number): Promise<string[]>;
    lremAsync(key: string, count: number, value: string): Promise<number>;
    lsetAsync(key: string, index: number, value: string): Promise<'OK'>;
    ltrimAsync(key: string, start: number, stop: number): Promise<'OK'>;
    mgetAsync: OverloadedCommandAsync<string, string[], R>;
    migrateAsync: OverloadedCommandAsync<string, boolean, R>;
    moveAsync(key: string, db: string | number): R;
    msetAsync: OverloadedCommandAsync<string, boolean, R>;
    msetnxAsync: OverloadedCommandAsync<string, boolean, R>;
    objectAsync: OverloadedCommandAsync<string, any, R>;
    persistAsync(key: string): Promise<number>;
    pexpireAsync(key: string, milliseconds: number): Promise<number>;
    pexpireatAsync(key: string, millisecondsTimestamp: number): Promise<number>;
    pfaddAsync: OverloadedKeyCommandAsync<string, number, R>;
    pfcountAsync: OverloadedCommandAsync<string, number, R>;
    pfmergeAsync: OverloadedCommandAsync<string, boolean, R>;
    psetexAsync(key: string, milliseconds: number, value: string)
      : Promise<'OK'>;
    pubsubAsync: OverloadedCommandAsync<string, number, R>;
    pttlAsync(key: string): Promise<number>;
    quitAsync(): Promise<'OK'>;
    randomkeyAsync(): Promise<string>;
    readonlyAsync(): Promise<string>;
    readwriteAsync(): Promise<string>;
    renameAsync(key: string, newkey: string): Promise<'OK'>;
    renamenxAsync(key: string, newkey: string): Promise<number>;
    restoreAsync(key: string, ttl: number, serializedValue: string): Promise<'OK'>;
    roleAsync(): Promise<[string, number, Array<[string, string, string]>]>;
    rpopAsync(key: string): Promise<string>;
    rpoplpushAsync(source: string, destination: string): Promise<string>;
    rpushAsync: OverloadedKeyCommandAsync<string, number, R>;
    rpushxAsync(key: string, value: string): Promise<number>;
    saddAsync: OverloadedKeyCommandAsync<string, number, R>;
    saveAsync(): Promise<string>;
    scardAsync(key: string): Promise<number>;
    scriptAsync: OverloadedCommandAsync<string, any, R>;
    sdiffAsync: OverloadedCommandAsync<string, string[], R>;
    sdiffstoreAsync: OverloadedKeyCommandAsync<string, number, R>;
    selectAsync(index: number | string): Promise<string>;
    setAsync(key: string, value: string, modeOrFlag?: string, duration?: number,
             flag?: string): Promise<'OK' | undefined>;
    setbitAsync(key: string, offset: number, value: string): Promise<number>;
    setexAsync(key: string, seconds: number, value: string): Promise<string>;
    setnxAsync(key: string, value: string): Promise<number>;
    setrangeAsync(key: string, offset: number, value: string): Promise<number>;
    shutdownAsync: OverloadedCommandAsync<string, string, R>;
    sinterAsync: OverloadedKeyCommandAsync<string, string[], R>;
    sinterstoreAsync: OverloadedCommandAsync<string, number, R>;
    sismemberAsync(key: string, member: string): Promise<number>;
    slaveofAsync(host: string, port: string | number): Promise<string>;
    slowlogAsync: OverloadedCommandAsync<string,
      Array<[number, number, number, string[]]>, R>;
    smembersAsync(key: string): Promise<string[]>;
    smoveAsync(source: string, destination: string, member: string)
      : Promise<number>;
    sortAsync: OverloadedCommandAsync<string, string[], R>;
    spopAsync(key: string): Promise<string>;
    spopAsync(key: string, count: number): Promise<string[]>;
    srandmemberAsync(key: string): Promise<string>;
    srandmemberAsync(key: string, count: number): Promise<string[]>;
    sremAsync: OverloadedKeyCommandAsync<string, number, R>;
    strlenAsync(key: string): Promise<number>;
    sunionAsync: OverloadedCommandAsync<string, string[], R>;
    sunionstoreAsync: OverloadedCommandAsync<string, number, R>;
    syncAsync(): Promise<undefined>;
    timeAsync(): Promise<[string, string]>;
    ttlAsync(key: string): Promise<number>;
    typeAsync(key: string): Promise<string>;
    unwatchAsync(): Promise<'OK'>;
    waitAsync(numslaves: number, timeout: number): Promise<number>;
    watchAsync: OverloadedCommandAsync<string, 'OK', R>;
    zaddAsync: OverloadedKeyCommandAsync<string | number, number, R>;
    zcardAsync(key: string): Promise<number>;
    zcountAsync(key: string, min: number | string, max: number | string)
      : Promise<number>;
    zincrbyAsync(key: string, increment: number, member: string)
      : Promise<string>;
    zinterstoreAsync: OverloadedCommandAsync<string | number, number, R>;
    zlexcountAsync(key: string, min: string, max: string): Promise<number>;
    zrangeAsync(key: string, start: number, stop: number, withscores?: string)
      : Promise<string[]>;
    zrangebylexAsync(key: string, min: string, max: string): Promise<string[]>;
    zrangebylexAsync(key: string, min: string, max: string, limit: string,
                     offset: number, count: number): Promise<string[]>;
    zrevrangebylexAsync(key: string, min: string, max: string)
      : Promise<string[]>;
    zrevrangebylexAsync(key: string, min: string, max: string, limit: string,
                        offset: number, count: number): Promise<string[]>;
    zrangebyscoreAsync(key: string, min: number | string, max: number | string,
                       withscores?: string): Promise<string[]>;
    zrangebyscoreAsync(key: string, min: number | string, max: number | string,
                       limit: string, offset: number, count: number)
      : Promise<string[]>;
    zrangebyscoreAsync(key: string, min: number | string, max: number | string,
                       withscores: string, limit: string, offset: number,
                       count: number): Promise<string[]>;
    zrankAsync(key: string, member: string): Promise<number | null>;
    zremAsync: OverloadedKeyCommandAsync<string, number, R>;
    zremrangebylexAsync(key: string, min: string, max: string): Promise<number>;
    zremrangebyrankAsync(key: string, start: number, stop: number)
      : Promise<number>;
    zremrangebyscoreAsync(key: string, min: string | number,
                          max: string | number): Promise<number>;
    zrevrangeAsync(key: string, start: number, stop: number,
                   withscores?: string): Promise<string[]>;
    zrevrangebyscoreAsync(key: string, min: number | string,
                          max: number | string, withscores?: string)
      : Promise<string[]>;
    zrevrangebyscoreAsync(key: string, min: number | string,
                          max: number | string, limit: string, offset: number,
                          count: number): Promise<string[]>;
    zrevrangebyscoreAsync(key: string, min: number | string,
                          max: number | string, withscores: string,
                          limit: string, offset: number, count: number)
      : Promise<string[]>;
    zrevrankAsync(key: string, member: string): Promise<number | null>;
    zscoreAsync(key: string, member: string): Promise<string>;
    zunionstoreAsync: OverloadedCommandAsync<string | number, number, R>;
    scanAsync: OverloadedCommandAsync<string, [string, string[]], R>;
    sscanAsync: OverloadedKeyCommandAsync<string, [string, string[]], R>;
    hscanAsync: OverloadedKeyCommandAsync<string, [string, string[]], R>;
    zscanAsync: OverloadedKeyCommandAsync<string, [string, string[]], R>;
  }
}
