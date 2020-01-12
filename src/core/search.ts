import {ResponseError} from '@elastic/elasticsearch/lib/errors';
import {CustomContextGlobal} from '../Server';
import {corePermission, coreThrow} from './errors';
import {Auth, ErrorsEnum} from './protocol';
import {Literal, Query, QueryQuery} from './query/wrapper';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeQueryString(str) {
  return str.replace(/[+-=&|><!(){}[\]^"~*?:\\/]/g, '\\$&');
}

export interface ExtraQueryParams {
  from?: number;
  size?: number;
  sort?: Array<{[key: string]: 'asc' | 'desc'}>;
  _source?: string[][];
}

function testMatchingFields(paths: string[],
                            source: string[][],
                            excludeId = false): string[] {
  const sources = new Set<string>();
  source
    .map(x => new RegExp(`^${x.map(escapeRegExp).join('[\\s\\S]*')}$`))
    .forEach(x => {
      paths.filter(y => x.test(y)).forEach(y => sources.add(y));
    });
  if (excludeId)
    sources.delete('_id');
  return [...sources];
}

function convertLiteral(str: string): null | boolean | number | string {
  if (str === 'null') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;
  const num = Number(str);
  return isNaN(num) ? str : num;
}

async function executeElasticQuery(
  query: Query, paths: string[],
  queryHandler: (query: QueryQuery) => Promise<any>): Promise<any> {
  function matchFields(fieldArg: Literal): string[] {
    let fields: string[] = [];
    if (fieldArg.type === 'literal') {
      if (!paths.includes(fieldArg.value))
        coreThrow(ErrorsEnum.INVALID, 'Field does not exist');
      fields.push(fieldArg.value);
    } else {
      fields = testMatchingFields(paths, [fieldArg.value]);
    }
    return fields;
  }
  switch (query.type) {
    case 'or':
      return {
        bool: {
          should: await Promise.all([query.left, query.right]
            .map(async x => await executeElasticQuery(x, paths, queryHandler))),
        },
      };
    case 'and':
      return {
        bool: {
          filter: await Promise.all([query.left, query.right]
            .map(async x => await executeElasticQuery(x, paths, queryHandler))),
        },
      };
    case 'not':
      return {
        bool: {
          must_not: await executeElasticQuery(query, paths, queryHandler),
        },
      };
    case 'is': {
      const {field: fieldArg, value: valueArg, isPhrase: isPhraseArg} = query;
      if (fieldArg === null) {
        if (valueArg.type === 'wildcard') {
          return {
            query_string: {
              query: valueArg.value.map(escapeQueryString).join('*'),
            },
          };
        }
        return {
          multi_match: {
            type: isPhraseArg ? 'phrase' : 'best_fields',
            query: convertLiteral(valueArg.value),
            lenient: true,
          },
        };
      } // ~ if (fieldArg === null)
      const fields: string[] = matchFields(fieldArg);
      const isExistsQuery = valueArg.type === 'wildcard' &&
        valueArg.value.length >= 2 && valueArg.value.every(x => x.length === 0);
      const isAllFieldsQuery = fields.length === paths.length;
      if (isExistsQuery && isAllFieldsQuery) {
        return {match_all: {}};
      }
      const queries = fields.map(field => {
        if (isExistsQuery) {
          return {
            exists: {
              field,
            },
          };
        } else if (valueArg.type === 'wildcard') {
          return {
            query_string: {
              fields: [field],
              query: valueArg.value.map(escapeQueryString).join('*'),
            },
          };
        } else {
          return {
            [isPhraseArg ? 'match_phrase' : 'match']: {
              [field]: convertLiteral(valueArg.value),
            },
          };
        }
      });
      return {
        bool: {
          should: queries,
          minimum_should_match: 1,
        },
      };
    }
    case 'range': {
      const {field: fieldArg, operator: operatorArg, value: valueArg} = query;
      const fields: string[] = matchFields(fieldArg);
      const queryParams: string = valueArg.type === 'literal' ?
        valueArg.value : valueArg.value.join('*');
      const queries = fields.map(field => {
        return {
          range: {[field]: {
            [operatorArg]: convertLiteral(queryParams),
          }},
        };
      });
      return {
        bool: {
          should: queries,
          minimum_should_match: 1,
        },
      };
    }
    case 'query': {
      const result = await queryHandler(query);
      return await executeElasticQuery({
        type: 'is',
        field: query.field,
        value: {
          type: 'literal',
          value: result,
        },
        isPhrase: false,
      }, paths, queryHandler);
    }
  }
}

const externalQueries: {
  [name: string]: (auth: Auth, global: CustomContextGlobal, query: Query,
                   params: ExtraQueryParams) => Promise<any>,
} = {
  users: executeUsersQuery,
  roles: executeRolesQuery,
  permissions: executePermissionsQuery,
};

export function externalQueryHandler(auth: Auth,
                                     global: CustomContextGlobal)
  : (query: QueryQuery) => Promise<string> {
  return async (query: QueryQuery) => {
    const index = query.index.type === 'literal' ?
      query.index.value : query.index.value.join('*');
    const handler = externalQueries[index];
    if (handler === undefined)
      coreThrow(ErrorsEnum.INVALID, 'External database does not exist');
    const result = await handler(auth, global, query.query, {size: 1});
    if (result.hits.length === 0)
      coreThrow(ErrorsEnum.INVALID, `No matching data in database ${index}`);
    return result.hits[0]._id;
  };
}

export async function executeQuery(auth: Auth,
                                   global: CustomContextGlobal,
                                   query: Query,
                                   realParams: any,
                                   model: any) {
  const queryBody = await executeElasticQuery(query, model.paths,
    externalQueryHandler(auth, global));
  try {
    const start = new Date();
    const result = await model.searchAsync(queryBody, realParams);
    const end = new Date();
    return {
      took: end.getTime() - start.getTime(),
      timeout: result.body.timed_out,
      total: result.body.hits.total,
      hits: result.body.hits.hits.map(
        x => Object.assign({_id: x._id}, x._source)),
    };
  } catch (e) {
    if (e instanceof ResponseError && e.statusCode < 500)
      coreThrow(ErrorsEnum.INVALID, 'Invalid query');
    throw e;
  }
}

export async function executeUsersQuery(auth: Auth,
                                        global: CustomContextGlobal,
                                        query: Query,
                                        params: ExtraQueryParams)
  : Promise<any> {
  await corePermission(auth, 'user', 'list');
  const realParams: any = Object.assign({}, params);
  const {users} = global;
  if (!params._source || params._source.length === 0) {
    realParams._source = false;
  } else {
    await corePermission(auth, 'user', 'read');
    realParams._source = testMatchingFields(users.paths, params._source, true);
  }
  return await executeQuery(auth, global, query, realParams, users);
}

export async function executeRolesQuery(auth: Auth,
                                        global: CustomContextGlobal,
                                        query: Query,
                                        params: ExtraQueryParams)
  : Promise<any> {
  await corePermission(auth, 'role', 'list');
  const realParams: any = Object.assign({}, params);
  const {roles} = global;
  if (!params._source || params._source.length === 0) {
    realParams._source = false;
  } else {
    await corePermission(auth, 'role', 'read');
    realParams._source = testMatchingFields(roles.paths, params._source, true);
  }
  return await executeQuery(auth, global, query, realParams, roles);
}

export async function executePermissionsQuery(auth: Auth,
                                              global: CustomContextGlobal,
                                              query: Query,
                                              params: ExtraQueryParams)
  : Promise<any> {
  await corePermission(auth, 'permission', 'list');
  const realParams: any = Object.assign({}, params);
  const {permissions} = global;
  if (!params._source || params._source.length === 0) {
    realParams._source = false;
  } else {
    await corePermission(auth, 'permission', 'read');
    realParams._source = testMatchingFields(permissions.paths,
      params._source, true);
  }
  return await executeQuery(auth, global, query, realParams, permissions);
}
