import createConstStr from './createConstantsStr';
import createVarStr from './createVarStr';
// {
//   atts = {},
//   unisVert = {},
//   unisFrag = {},
//   varyings = {},
//   defs = {},
//   shaderFrag = '',
//   shaderVert = '',
// }
export default function setOnBeforeCompile(
  {
    atts = {},
    unisVert = {},
    unisFrag = {},
    varyings = {},
    defs = {},
    constantsFrag = {},
    constantsVert = {},
    uniqueVars = {},
    shaderFnsFrag = '',
    shaderFrag = '',
    shaderFnsVert = '',
    shaderVert = '',
    pointSizeVert = '',
  },
  shader
) {
  const vertStr = createVarStr({
    atts: { ...atts },
    unis: { ...unisVert },
    varyings: { ...varyings },
  });
  const fragStr = createVarStr({
    atts: {},
    unis: { ...unisFrag },
    varyings: { ...varyings },
  });
  const constantsFragStr = createConstStr(constantsFrag);
  const constantsVertStr = createConstStr(constantsVert);

  shader.defines = { ...shader.defines, ...defs };
  shader.uniforms = { ...shader.uniforms, ...unisVert, ...unisFrag };

  let token, insert;

  // uniform vec3 diffuse;
  // ///////////////////////////////////////////////////////////////////////
  // Vertex Shader Definitions
  // ///////////////////////////////////////////////////////////////////////
  token = '#include <common>';
  insert = `
${token}
${constantsVertStr}
${vertStr}`;
  shader.vertexShader = shader.vertexShader.replace(token, insert);
  // ///////////////////////////////////////////////////////////////////////
  // Vertex Shader Logic
  // ///////////////////////////////////////////////////////////////////////
  token = '#include <begin_vertex>';
  insert = `
${token}
${shaderVert}
${shaderFnsVert}
`;
  shader.vertexShader = shader.vertexShader.replace(token, insert);
  // ///////////////////////////////////////////////////////////////////////
  // Point Specific Vertex Shader Logic
  // ///////////////////////////////////////////////////////////////////////
  token = 'gl_PointSize = size;';
  insert = `
${token}
${pointSizeVert}
`;
  shader.vertexShader = shader.vertexShader.replace(token, insert);

  // ///////////////////////////////////////////////////////////////////////
  // Fragment Shader Definitions
  // ///////////////////////////////////////////////////////////////////////
  token = '#include <common>';
  insert = `
${token}
${fragStr}
${shaderFnsFrag}
`;
  shader.fragmentShader = shader.fragmentShader.replace(token, insert);
  // ///////////////////////////////////////////////////////////////////////
  // Fragment Shader Logic
  // ///////////////////////////////////////////////////////////////////////
  // Add above fragment shader main() so we can access common.glsl.js
  if (shaderFrag) {
    token = '#include <color_fragment>';
    insert = `
${constantsFragStr}
${shaderFrag}
`;
    // ${token}

    shader.fragmentShader = shader.fragmentShader.replace(token, insert);
  }
  Object.entries(uniqueVars).map(([key, val]) => {
    shader.fragmentShader = shader.fragmentShader.replaceAll(key, val);
  });
}
