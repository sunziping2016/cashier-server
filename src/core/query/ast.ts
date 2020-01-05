import { parse as parseKuery } from './parser';

export function fromLiteralExpression(expression, parseOptions?) {
  parseOptions = {
    ...parseOptions,
    startRule: 'Literal',
  };

  return fromExpression(expression, parseOptions, parseKuery);
}

function fromExpression(expression, parseOptions = {}, parse = parseKuery) {
  if (expression === undefined) {
    throw new Error('expression must be a string, got undefined instead');
  }

  return parse(expression, parseOptions);
}
