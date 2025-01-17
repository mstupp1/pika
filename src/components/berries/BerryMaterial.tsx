import * as THREE from 'three';
import setOnBeforeCompile from '@/utils/setOnBeforeCompile';
import { glslVarTypes } from '@/types/glsl.types';

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

export function createBerryMaterial() {
  const material: any = new THREE.MeshStandardMaterial({
    metalness: 0.4,
    roughness: 0.5,
  });
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
        shaderVert: `
          vType = instanceType;
          vState = instanceState;
          
          // Update position based on state
          vec3 pos = position;
          vec3 instancePos = instancePosition;
          
          if (instanceState > 0.0) {
            // Apply gravity to raining berries
            vec3 curVel = instanceVelocity;
            vec3 curPos = instancePos;
            float curState = instanceState;
            if (instanceState == 1.0) {
              curVel.y -= 9.8 * deltaTime;
              curPos += curVel * deltaTime;
              
              // Check for landing
              if (instancePos.y <= 0.5) {
                curPos.y = 0.5;
                curState = 2.0;
              }
            }
            
            // Add floating animation for landed berries
            if (instanceState == 2.0) {
              curPos.y += sin(time * 2.0 + instanceSeed * 6.28) * 0.1;
            }
            
            // Apply position and rotation
            float rotation = time * 0.5 + instanceSeed * 6.28;
            pos = (pos * (0.8 + instanceSeed * 0.4));
            pos = vec3(
              pos.x * cos(rotation) - pos.z * sin(rotation),
              pos.y,
              pos.x * sin(rotation) + pos.z * cos(rotation)
            );
            pos += curPos;
          }
          
          transformed = pos;
        `,
        shaderFrag: `
         
          
          // Hide inactive berries
          if (vState < 0.5) {
            discard;
          }
        `,
      },
      shader
    );
  };

  return material;
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
