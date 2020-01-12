import {IParseOptions, parse as parseQuery} from './parser';

export interface OrQuery {
  type: 'or';
  left: Query;
  right: Query;
}

export interface AndQuery {
  type: 'and';
  left: Query;
  right: Query;
}

export interface NotQuery {
  type: 'not';
  query: Query;
}

export interface IsQuery {
  type: 'is';
  field: Literal | null;
  value: Literal;
  isPhrase: boolean;
}

export interface RangeQuery {
  type: 'range';
  field: Literal;
  operator: 'lte' | 'gte' | 'lt' | 'gt';
  value: Literal;
}

export interface QueryQuery {
  type: 'query';
  field: Literal | null;
  index: Literal;
  query: Query;
}

export type Query = OrQuery | AndQuery | NotQuery |
  IsQuery | RangeQuery | QueryQuery;

export interface StringLiteral {
  type: 'literal';
  value: string;
}

export interface WildcardLiteral {
  type: 'wildcard';
  value: string[];
}

export type Literal = StringLiteral | WildcardLiteral;

export type ParseFunction = (input: string, options?: IParseOptions) => Query;
export const parse: ParseFunction = parseQuery;
