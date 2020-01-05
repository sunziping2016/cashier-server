import * as ast from '../ast';
import * as literal from '../nodeTypes/literal';

export function buildNodeParams(fieldName, value, isPhrase = false) {
  const fieldNode = typeof fieldName === 'string' ?
    ast.fromLiteralExpression(fieldName) : literal.buildNode(fieldName);
  const valueNode = typeof value === 'string' ?
    ast.fromLiteralExpression(value) : literal.buildNode(value);
  const isPhraseNode = literal.buildNode(isPhrase);
  return {
    arguments: [fieldNode, valueNode, isPhraseNode],
  };
}
