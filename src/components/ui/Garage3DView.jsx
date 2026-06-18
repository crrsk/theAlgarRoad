import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import CarModel from '../scene/CarModel';

function RotatingCar({ modelPath }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Girar el coche lentamente
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <CarModel modelPath={modelPath} isGarage={true} />
    </group>
  );
}

export default function Garage3DView({ carConfig }) {
  return (
    <div className="garage-3d-container">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1.5, 5]} fov={50} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.2} 
          />
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <RotatingCar modelPath={carConfig.model} />
        </Suspense>
      </Canvas>
    </div>
  );
}
