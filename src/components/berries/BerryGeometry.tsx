import * as THREE from 'three';

export function createBerryGeometry(count: number) {
  const geometry = new THREE.SphereGeometry(1, 32, 32);

  // Instance attributes
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const states = new Float32Array(count); // 0: inactive, 1: raining, 2: landed
  const types = new Float32Array(count); // 0: normal, 1: golden, 2: purple
  const seeds = new Float32Array(count); // Random values for variation
  const spawnTimes = new Float32Array(count);

  // Initialize attributes
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 1] = 35; // Start high up
    seeds[i] = Math.random();
    spawnTimes[i] = -1; // Not spawned yet
  }

  geometry.setAttribute(
    'instancePosition',
    new THREE.InstancedBufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    'instanceVelocity',
    new THREE.InstancedBufferAttribute(velocities, 3)
  );
  geometry.setAttribute(
    'instanceState',
    new THREE.InstancedBufferAttribute(states, 1)
  );
  geometry.setAttribute(
    'instanceType',
    new THREE.InstancedBufferAttribute(types, 1)
  );
  geometry.setAttribute(
    'instanceSeed',
    new THREE.InstancedBufferAttribute(seeds, 1)
  );
  geometry.setAttribute(
    'instanceSpawnTime',
    new THREE.InstancedBufferAttribute(spawnTimes, 1)
  );

  return geometry;
}
