export function buildNode(index, query, path) {
  return {
    type: 'literal',
    index,
    query,
    path,
  };
}
