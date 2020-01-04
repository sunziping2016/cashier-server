import {InitialGlobal} from '../Server';
import Jwt from './jwt';
import Users from './rbac';

export default async function(initialGlobal: InitialGlobal) {
  return {
    jwt: await Jwt(initialGlobal),
    ...await Users(initialGlobal),
  };
}
