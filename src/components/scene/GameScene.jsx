import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import CityEnvironment from './CityEnvironment';
import ControllableCar from './ControllableCar';
import TrafficManager from './TrafficManager';

function SceneLights({ theme }) {
  const isNight = theme.type === 'night';

  return (
    <>
      <Environment preset="studio" />
      <hemisphereLight
        intensity={isNight ? 0.42 : 0.72}
        color={isNight ? 0x8fb8ff : 0xdde8ff}
        groundColor={0x202033}
      />
      <ambientLight intensity={isNight ? 0.2 : 0.42} color={0xffffff} />
      <directionalLight
        position={[2, 4, 3]}
        intensity={theme.keyLight}
        color={theme.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        position={[0, 2.7, 3.2]}
        angle={0.34}
        penumbra={0.7}
        intensity={isNight ? 0.72 : 1.85}
        color={theme.sunColor}
        castShadow
      />
      <pointLight position={[0, 1.25, 2.45]} intensity={0.58} color={0xffffff} />
      <pointLight position={[-1.45, 1.15, -1.9]} intensity={1.15} color={0x66d9ff} />
      <pointLight position={[1.45, 1.05, -1.9]} intensity={0.82} color={0xffbd76} />
      <directionalLight position={[-3, 1, -2]} intensity={0.45} color={0x88bbff} />
    </>
  );
}

export default function GameScene({ sceneTheme }) {
  return (
    <Canvas
      shadows
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.18,
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 1.7, 7.4]}
        rotation={[-0.12, 0, 0]}
        fov={58}
      />
      <OrbitControls
        target={[0, 0.45, 0]}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={5.2}
        maxDistance={10.5}
        minPolarAngle={Math.PI * 0.24}
        maxPolarAngle={Math.PI * 0.54}
        minAzimuthAngle={-Math.PI * 0.34}
        maxAzimuthAngle={Math.PI * 0.34}
        rotateSpeed={0.55}
        zoomSpeed={0.75}
      />
      <color attach="background" args={[sceneTheme.sky]} />
      <fog attach="fog" args={[sceneTheme.fog, 15, 35]} />
      <SceneLights theme={sceneTheme} />
      <CityEnvironment theme={sceneTheme} />

      <TrafficManager />
      <ControllableCar />
    </Canvas>
  );
}
