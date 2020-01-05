import {nodeTypes} from './index';

export function buildNode(name, value) {
  const argumentNode = (value.type === 'literal') ?
    value : nodeTypes.literal.buildNode(value);
  return {
    type: 'namedArg',
    name,
    value: argumentNode,
  };
}
