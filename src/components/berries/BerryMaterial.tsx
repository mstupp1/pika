import * as THREE from 'three';
import { useMemo } from 'react';
import setOnBeforeCompile from '@/utils/setOnBeforeCompile';
import { glslVarTypes } from '@/types/glsl.types';
import { useGLTF } from '@react-three/drei';
import berryVert from './glsl/berry.vert.glsl?raw';
const unisVert = {
  time: { value: 0, type: glslVarTypes.float },
  deltaTime: { value: 0, type: glslVarTypes.float },
};
const varyings = {
  vType: { value: 0, type: glslVarTypes.float },
  vState: { value: 0, type: glslVarTypes.float },
};
const tempVec3 = [0, 0, 0];
const floatVary = { value: 0, type: glslVarTypes.float };
const vec3Vary = { value: tempVec3, type: glslVarTypes.vec3 };
const chanAtt = { value: 0, type: glslVarTypes.float };

export function useBerryMaterial() {
  const { nodes } = useGLTF('/berry.glb') as any;

  return useMemo(() => {
    const material: any = nodes.Berry.material;
    material.uniforms = {
      ...unisVert,
    };
    material.onBeforeCompile = (shader) => {
      setOnBeforeCompile(
        {
          atts: {
            instancePosition: { ...vec3Vary },
            instanceVelocity: { ...vec3Vary },
            instanceState: { ...floatVary },
            instanceType: { ...floatVary },
            instanceSeed: { ...floatVary },
            instanceSpawnTime: { ...floatVary },
          },
          unisVert: {
            ...unisVert,
          },
          // unisFrag: {
          //   ...unisVert,
          // },
          varyings: { ...varyings },
          shaderVert: berryVert,
          // shaderFrag: `

          //   // Hide inactive berries
          //   // if (vState < 0.5) {
          //   //   discard;
          //   // }
          // `,
        },
        shader
      );
    };

    return material;
  }, []);
}
//  // Apply colors based on type
//  vec3 berryColor = vec3(1.0, 0.0, 0.0); // Default red
//  if (vType > 0.5 && vType < 1.5) {
//    berryColor = vec3(1.0, 0.843, 0.0); // Golden
//    material.metalness = 0.8;
//    material.roughness = 0.2;
//  } else if (vType > 1.5) {
//    berryColor = vec3(0.5, 0.0, 0.5); // Purple
//    material.metalness = 0.4;
//    material.roughness = 0.5;
//  }

//  diffuseColor.rgb = berryColor;
