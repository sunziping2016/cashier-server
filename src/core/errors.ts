import Ajv from 'ajv';
import createError from 'http-errors';
import {Auth, CoreResponse, ErrorsEnum} from './protocol';

const ajv = new Ajv();

export function coreOkay(payload: any): CoreResponse {
  if (payload === undefined) {
    return {code: ErrorsEnum.OK};
  } else if (typeof payload === 'string')
    payload = {message: payload};
  return {
    code: ErrorsEnum.OK,
    payload,
  };
}

export function coreCreateError(code: ErrorsEnum, message: string): Error {
  return createError(code, message);
}

export function coreThrow(code: ErrorsEnum, message: string): never {
  throw coreCreateError(code, message);
}

export function coreValidate(schema: Ajv.ValidateFunction, data: any): void {
  if (!schema(data))
    coreThrow(ErrorsEnum.SCHEMA, ajv.errorsText(schema.errors));
}

export async function corePermission(auth: Auth | undefined,
                                     subject: string, action: string)
  : Promise<void> {
  if (!(auth && await auth.hasPermission(subject, action)))
    coreThrow(ErrorsEnum.PERMISSION,
      `Require \"${action} ${subject}\" permission`);
}

export function coreAssert(predict: boolean,
                           code: ErrorsEnum,
                           message: string): void {
  if (!predict)
    coreThrow(code, message);
}
