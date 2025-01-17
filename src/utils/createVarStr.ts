// import { glslVarTypes } from '@/types/glsl.types';
import getVarType from '@/utils/getVarType';

const glslStoreType = {
  atts: 'attribute',
  unis: 'uniform',
  varyings: 'varying',
};

export default function createVarStr(
  variables = { atts: {}, unis: {}, varyings: {} }
) {
  let shaderStr = '';

  for (const dataType in variables) {
    for (const va in variables[dataType]) {
      console.log(variables[dataType][va]);
      const variable = variables[dataType][va];
      const { varType, isArr } = getVarType(variable.type);
      shaderStr = !isArr
        ? `${shaderStr}
      ${glslStoreType[dataType]} ${varType} ${va};`
        : `${shaderStr}
      ${glslStoreType[dataType]} ${varType} ${va}[${variable.value.length}];`;
    }
  }

  return shaderStr;
}
