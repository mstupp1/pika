// Declare varying variables to pass to fragment shader

  // Pass instance attributes to varyings
vType = instanceType;
vState = instanceState;

vec3 instancePos = instancePosition;
// instancePos.x = 0.;
// instancePos.z = 0.;
vec3 velocity = instanceVelocity; // Create local copy of velocity

if(instanceState > 0.0) {
      // Apply gravity to raining berries
if(instanceState == 1.0) {
velocity.y -= 9.8 * deltaTime;
instancePos.y += velocity.y * deltaTime;

          // Check for landing
if(instancePos.y <= 0.5) {
instancePos.y = 0.5;
              // We'll need to handle state changes differently
              // instanceState = 2.0; // Can't modify input attribute
}
}

      // Add floating animation for landed berries
if(instanceState == 2.0) {
instancePos.y += sin(time * 2.0 + instanceSeed * 6.28) * 2.1;
}
instancePos.y += sin(time * .5 + instanceSeed * 6.28) * 0.5;

// instancePos.y += 2.;
// transformed.y += 2.;
      // Apply position and rotation
// float rotation = time * 0.5 + instanceSeed * 6.28;
// transformed *= (0.8 + instanceSeed * 0.4);
// transformed = vec3(transformed.x * cos(rotation) - transformed.z * sin(rotation), transformed.y, transformed.x * sin(rotation) + transformed.z * cos(rotation));
transformed += instancePos;
// transformed *= 0.3;

}
