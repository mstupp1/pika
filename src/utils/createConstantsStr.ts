const glslIterTypes = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
};

export default function createConstStr(constants) {
  let constantStr = '';
  // console.log(constants);
  for (const currConst in constants) {
    const constName = constants[currConst].name;
    const iterNum = glslIterTypes[constants[currConst].type];
    const constArrCheck = constants[currConst].isArr;
    const constType = constants[currConst].type;
    const constVal = constants[currConst].value;
    // console.log(iterNum);
    if (constArrCheck) {
      const constLen = constVal.length / iterNum;
      const constLenM1 = constLen - 1;
      constantStr += `const ${constType} ${constName}[${constLen}] = ${constType}[](`;
      for (let i = 0; i < constLenM1; i++) {
        const id = iterNum * i;
        constantStr += `${constType}(${constVal[id]},${constVal[id + 1]}), `;
        // console.log(constants[constant].value[i]);
        // console.log(constName);
      }
      constantStr += `${constType}(${constVal[constLenM1 * iterNum]},${
        constVal[constLenM1 * iterNum + 1]
      }));
`;
      // constantStr += ' constant';
    } else {
      constantStr += `const ${constType} ${constName} = ${constVal};
`;
    }
  }

  return constantStr;
}
// const vec2 fDirs[8] = vec2[](vec2(0., 1.), vec2(0.7071, 0.7071), vec2(1., 0.), vec2(0.7071, -0.7071), vec2(0., -1.), vec2(-0.7071, -0.7071), vec2(-1., 0.), vec2(-0.7071, 0.7071));
