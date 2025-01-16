useFrame((state, delta) => {
  // Always move forward
  const forward = true; // Remove keyboard check and always set to true
  const leftward = keyboard.current.a || keyboard.current.ArrowLeft;
  const rightward = keyboard.current.d || keyboard.current.ArrowRight;
  const jumping = keyboard.current.Space;

  // Calculate forward movement
  const forwardVelocity = forward ? MOVEMENT_SPEED : 0;

  // ... rest of useFrame remains the same ...
});
