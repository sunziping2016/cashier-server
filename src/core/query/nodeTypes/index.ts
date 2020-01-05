import * as functionType from './function';
import * as literal from './literal';
import * as namedArg from './namedArg';
import * as query from './query';
import * as wildcard from './wildcard';

export const nodeTypes = {
  function: functionType,
  literal,
  namedArg,
  query,
  wildcard,
};
