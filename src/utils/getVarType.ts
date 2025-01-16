import { glslVarTypes } from '@/types/glsl.types';

export default function getVarType(varTypeStr: string) {
  switch (varTypeStr) {
    case glslVarTypes.boolArr:
      return { varType: glslVarTypes.bool, isArr: true };
    case glslVarTypes.intArr:
      return { varType: glslVarTypes.int, isArr: true };
    case glslVarTypes.floatArr:
      return { varType: glslVarTypes.float, isArr: true };
    default:
      return { varType: varTypeStr, isArr: false };
  }
}
