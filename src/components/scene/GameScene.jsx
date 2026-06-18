import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';
import CityEnvironment from './CityEnvironment';
import RetrowaveEnvironment from './RetrowaveEnvironment';
import ControllableCar from './ControllableCar';
import TrafficManager from './TrafficManager';
import { GameState } from '../../gameState';
import { getThemeByName } from '../../utils/sceneTheme';

function BiomeController({ baseCityTheme }) {
  const { scene } = useThree();
  
  const hemiRef = useRef(null);
  const ambientRef = useRef(null);
  const dirRef = useRef(null);
  const spotRef = useRef(null);
  const point1Ref = useRef(null);
  const point2Ref = useRef(null);
  const point3Ref = useRef(null);
  const dir2Ref = useRef(null);

  useEffect(() => {
    scene.background = new THREE.Color(baseCityTheme.sky);
    scene.fog = new THREE.Fog(baseCityTheme.fog, 15, 35);
  }, [baseCityTheme, scene]);

  useFrame((_, delta) => {
    // Avanzar la transición solo si el juego está activo
    if (!GameState.isGameOver && !GameState.isPaused && !GameState.isMenu) {
      if (GameState.transitionPhase === 0 && GameState.distance >= GameState.nextBiomeDistance) {
        GameState.targetBiome = GameState.currentBiome === 'city' ? 'retrowave' : 'city';
        GameState.transitionPhase = 1;
        GameState.transitionTimer = 0;
        GameState.transitionProgress = 0;
        // La transición tarda unos 120m en completarse a max velocidad. 
        // Sumamos 800 para que cada bioma dure lo suficiente.
        GameState.nextBiomeDistance = GameState.distance + 800;
      }

      if (GameState.transitionPhase === 1) {
        GameState.transitionTimer += delta;
        // Tiempo para limpiar la calzada (la pista mide ~55, a speed 30 tardaría ~2s)
        const despawnTime = 60 / Math.max(GameState.speed, 10);
        if (GameState.transitionTimer >= despawnTime) {
          GameState.transitionPhase = 2;
          GameState.transitionProgress = 0;
        }
      } else if (GameState.transitionPhase === 2) {
        GameState.transitionProgress += delta / 1.5; // 1.5 segundos de oscuridad (Color Shift)
        if (GameState.transitionProgress >= 1) {
          GameState.transitionProgress = 1;
          GameState.currentBiome = GameState.targetBiome;
          GameState.transitionPhase = 0; // Termina la transición, comienza a spawnear el nuevo bioma
        }
      }
    }

    // Siempre aplicar la iluminación para que no se reinicie al pausar
    const themeA = GameState.currentBiome === 'city' ? baseCityTheme : getThemeByName('retrowave');
    const themeB = GameState.targetBiome === 'city' ? baseCityTheme : getThemeByName('retrowave');
    const t = GameState.transitionProgress;

    const isNightA = themeA.type === 'night' || themeA.type === 'retrowave';
    const isNightB = themeB.type === 'night' || themeB.type === 'retrowave';

    scene.background.lerpColors(new THREE.Color(themeA.sky), new THREE.Color(themeB.sky), t);
    scene.fog.color.lerpColors(new THREE.Color(themeA.fog), new THREE.Color(themeB.fog), t);

    const isRetrowaveA = GameState.currentBiome === 'retrowave';
    const isRetrowaveB = GameState.targetBiome === 'retrowave';

    if (hemiRef.current) {
      const hemiA = isRetrowaveA ? 0x220044 : (isNightA ? 0x8fb8ff : 0xdde8ff);
      const hemiB = isRetrowaveB ? 0x220044 : (isNightB ? 0x8fb8ff : 0xdde8ff);
      hemiRef.current.color.lerpColors(new THREE.Color(hemiA), new THREE.Color(hemiB), t);
      const intensityA = isRetrowaveA ? 0.05 : (isNightA ? 0.42 : 0.72);
      const intensityB = isRetrowaveB ? 0.05 : (isNightB ? 0.42 : 0.72);
      hemiRef.current.intensity = THREE.MathUtils.lerp(intensityA, intensityB, t);
    }
    
    if (ambientRef.current) {
      const colA = isRetrowaveA ? 0x110022 : 0xffffff;
      const colB = isRetrowaveB ? 0x110022 : 0xffffff;
      ambientRef.current.color.lerpColors(new THREE.Color(colA), new THREE.Color(colB), t);
      
      const intensityA = isRetrowaveA ? 0.05 : (isNightA ? 0.2 : 0.42);
      const intensityB = isRetrowaveB ? 0.05 : (isNightB ? 0.2 : 0.42);
      ambientRef.current.intensity = THREE.MathUtils.lerp(intensityA, intensityB, t);
    }

    if (dirRef.current) {
      dirRef.current.color.lerpColors(new THREE.Color(themeA.sunColor), new THREE.Color(themeB.sunColor), t);
      dirRef.current.intensity = THREE.MathUtils.lerp(themeA.keyLight, themeB.keyLight, t);
    }

    if (spotRef.current) {
      spotRef.current.color.lerpColors(new THREE.Color(themeA.sunColor), new THREE.Color(themeB.sunColor), t);
      const intensityA = isRetrowaveA ? 0.1 : (isNightA ? 0.72 : 1.85);
      const intensityB = isRetrowaveB ? 0.1 : (isNightB ? 0.72 : 1.85);
      spotRef.current.intensity = THREE.MathUtils.lerp(intensityA, intensityB, t);
    }

    if (point1Ref.current) point1Ref.current.intensity = THREE.MathUtils.lerp(isRetrowaveA ? 0 : 0.58, isRetrowaveB ? 0 : 0.58, t);
    if (point2Ref.current) point2Ref.current.intensity = THREE.MathUtils.lerp(isRetrowaveA ? 0 : 1.15, isRetrowaveB ? 0 : 1.15, t);
    if (point3Ref.current) point3Ref.current.intensity = THREE.MathUtils.lerp(isRetrowaveA ? 0 : 0.82, isRetrowaveB ? 0 : 0.82, t);
    if (dir2Ref.current) dir2Ref.current.intensity = THREE.MathUtils.lerp(isRetrowaveA ? 0 : 0.45, isRetrowaveB ? 0 : 0.45, t);

    if (scene.environmentIntensity !== undefined) {
      scene.environmentIntensity = THREE.MathUtils.lerp(isRetrowaveA ? 0.05 : 1.0, isRetrowaveB ? 0.05 : 1.0, t);
    }
  });

  return (
    <>
      <Environment preset="studio" />
      <hemisphereLight ref={hemiRef} intensity={0.72} color={0xdde8ff} groundColor={0x202033} />
      <ambientLight ref={ambientRef} intensity={0.42} color={0xffffff} />
      <directionalLight ref={dirRef} position={[2, 4, 3]} intensity={1.35} color={0xfff4e4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <spotLight ref={spotRef} position={[0, 2.7, 3.2]} angle={0.34} penumbra={0.7} intensity={1.85} color={0xfff4e4} castShadow />
      
      <pointLight ref={point1Ref} position={[0, 1.25, 2.45]} intensity={0.58} color={0xffffff} />
      <pointLight ref={point2Ref} position={[-1.45, 1.15, -1.9]} intensity={1.15} color={0x66d9ff} />
      <pointLight ref={point3Ref} position={[1.45, 1.05, -1.9]} intensity={0.82} color={0xffbd76} />
      <directionalLight ref={dir2Ref} position={[-3, 1, -2]} intensity={0.45} color={0x88bbff} />
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
      <Suspense fallback={null}>
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
          maxPolarAngle={Math.PI * 0.49}
          minAzimuthAngle={-Math.PI * 0.34}
          maxAzimuthAngle={Math.PI * 0.34}
          rotateSpeed={0.55}
          zoomSpeed={0.75}
        />
        <BiomeController baseCityTheme={sceneTheme} />
        <Physics>
          <CityEnvironment theme={sceneTheme} />
          <RetrowaveEnvironment />
          <TrafficManager />
          <ControllableCar />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
