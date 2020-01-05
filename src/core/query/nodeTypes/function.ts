import {functions} from '../functions';

export function buildNode(functionName, ...functionArgs) {

  const kueryFunction = functions[functionName];
  if (kueryFunction === undefined) {
    throw new Error(`Unknown function "${functionName}"`);
  }

  return {
    type: 'function',
    function: functionName,
    ...kueryFunction.buildNodeParams(...functionArgs),
  };
}

export function buildNodeWithArgumentNodes(functionName, argumentNodes) {
  if (functions[functionName] === undefined) {
    throw new Error(`Unknown function "${functionName}"`);
  }

  return {
    type: 'function',
    function: functionName,
    arguments: argumentNodes,
  };
}
