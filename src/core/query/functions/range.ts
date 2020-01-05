import * as ast from '../ast';
import {nodeTypes} from '../nodeTypes';

export function buildNodeParams(fieldName, params) {
  const newParams = {};
  for (const field of ['gt', 'lt', 'gte', 'lte', 'format'])
    if (params[field] !== undefined)
      newParams[field] = params[field];
  const fieldNameArg = typeof fieldName === 'string' ?
    ast.fromLiteralExpression(fieldName) :
    nodeTypes.literal.buildNode(fieldName);
  const args = Object.keys(newParams).map(key => {
    const value = newParams[args];
    return nodeTypes.namedArg.buildNode(key, value);
  });

  return {
    arguments: [fieldNameArg, ...args],
  };
}
