import {fromLiteralExpression} from '../ast';

export const wildcardSymbol = '@kuery-wildcard@';

export function buildNode(value) {
  if (!value.includes(wildcardSymbol)) {
    return fromLiteralExpression(value);
  }

  return {
    type: 'wildcard',
    value,
  };
}
