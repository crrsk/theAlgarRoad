import { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import CarModel from './CarModel';
import { GameState } from '../../gameState';
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement';

const MOVEMENT_BOUNDS = {
  maxX: 1.75,
  minX: -1.75,
};

const STEERING_SPEED = 5.5; // Mejor giro a altas velocidades
const FRICTION = 8; // Fricción y resistencia del aire

const policeSirenAudio = new Audio('./sounds/police-sirene.mp3');
policeSirenAudio.loop = true;
policeSirenAudio.volume = 0.6;

export default function ControllableCar() {
  const groupRef = useRef(null);
  const rigidBodyRef = useRef(null);
  const pressedKeysRef = useKeyboardMovement();
  const slowTimer = useRef(0);
  const engineAudioRef = useRef(null);

  useEffect(() => {
    let source;
    let audioCtx;
    let gainNode;

    const initAudio = async () => {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const res = await fetch('./sounds/engine.mp3');
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // --- Algoritmo Avanzado de Loop Perfecto (Crossfade + Trim) ---
        const channel0 = audioBuffer.getChannelData(0);
        let startSample = 0;
        let endSample = channel0.length - 1;
        const threshold = 0.015;

        while (startSample < channel0.length && Math.abs(channel0[startSample]) < threshold) startSample++;
        while (endSample > 0 && Math.abs(channel0[endSample]) < threshold) endSample--;

        if (startSample >= endSample) { startSample = 0; endSample = channel0.length - 1; }

        const N = endSample - startSample + 1;
        // Crossfade de 400ms o el 25% del archivo (lo que sea menor)
        const C = Math.floor(Math.min(0.4 * audioBuffer.sampleRate, N * 0.25));

        let finalBuffer;
        if (N > C * 2) {
          finalBuffer = audioCtx.createBuffer(audioBuffer.numberOfChannels, N - C, audioBuffer.sampleRate);
          for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const inData = audioBuffer.getChannelData(ch);
            const outData = finalBuffer.getChannelData(ch);

            // 1. Copiar la sección central (sin alteraciones)
            for (let i = 0; i < N - 2 * C; i++) {
              outData[i] = inData[startSample + C + i];
            }

            // 2. Crear la región de Crossfade (fusiona el final con el principio)
            for (let i = 0; i < C; i++) {
              const fade = i / C; // Sube de 0 a 1
              const fadeOutSample = inData[startSample + N - C + i] * (1 - fade);
              const fadeInSample = inData[startSample + i] * fade;
              outData[N - 2 * C + i] = fadeOutSample + fadeInSample;
            }
          }
        } else {
          finalBuffer = audioBuffer;
        }

        source = audioCtx.createBufferSource();
        source.buffer = finalBuffer;
        source.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start();

        engineAudioRef.current = { source, gainNode, audioCtx };
      } catch (err) {
        console.error("Error loading engine audio:", err);
      }
    };

    initAudio();

    return () => {
      try {
        if (source) source.stop();
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      } catch (e) { }
    };
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const audioData = engineAudioRef.current;
    if (audioData && audioData.audioCtx) {
      if (GameState.isMenu || GameState.isPaused || GameState.isGameOver) {
        audioData.gainNode.gain.setTargetAtTime(0, audioData.audioCtx.currentTime, 0.1);
      } else {
        if (audioData.audioCtx.state === 'suspended') {
          audioData.audioCtx.resume();
        }

        const rawMaxSpeedAudio = GameState.selectedCar.maxSpeed / 10;

        // Calcular pitch (1.0 base, hasta 2.5 en velocidad máxima)
        const targetPitch = 1.0 + (GameState.speed / rawMaxSpeedAudio) * 1.5;
        audioData.source.playbackRate.setTargetAtTime(targetPitch, audioData.audioCtx.currentTime, 0.1);

        // Volumen entre 0.3 (ralentí) y 0.7 (a tope)
        const targetVol = 0.3 + (GameState.speed / rawMaxSpeedAudio) * 0.4;
        audioData.gainNode.gain.setTargetAtTime(targetVol, audioData.audioCtx.currentTime, 0.1);
      }
    }

    if (GameState.needsPositionReset && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: 0, y: -0.5, z: 0 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Resetear rotación visual
      if (groupRef.current) {
        groupRef.current.rotation.z = 0;
        groupRef.current.rotation.y = Math.PI;
      }

      GameState.playerX = 0;
      GameState.needsPositionReset = false;
    }

    if (GameState.isMenu || GameState.isPaused) {
      if (!policeSirenAudio.paused) {
        policeSirenAudio.pause();
      }
      return;
    }

    if (GameState.isGameOver) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * 5);
      if (!policeSirenAudio.paused) {
        policeSirenAudio.pause();
        policeSirenAudio.currentTime = 0;
      }
      return;
    }

    // Penalización por ir muy lento O por ir pegado a un coche (tailgating)
    // distance > 5 significa unos 5 segundos después de arrancar (a 100km/h)
    if (GameState.distance > 5) {
      if (GameState.speed <= 11 || GameState.isTailgating) {
        slowTimer.current += delta;
        if (slowTimer.current > 5 && !GameState.policeActive) {
          GameState.policeRequested = true;
          slowTimer.current = 0;
        }
      } else {
        slowTimer.current = 0;
      }
    } else {
      slowTimer.current = 0;
    }

    // Control de la sirena de policía:
    // Suena si la policía está en escena, o si estamos en la zona de advertencia (1s antes de que aparezca)
    if (GameState.policeActive || slowTimer.current > 4) {
      if (policeSirenAudio.paused) {
        policeSirenAudio.play().catch(e => console.log("Siren error:", e));
      }
    } else {
      if (!policeSirenAudio.paused) {
        policeSirenAudio.pause();
        policeSirenAudio.currentTime = 0;
      }
    }

    const keys = pressedKeysRef.current;

    GameState.isHandbrake = keys.Space;
    const HANDBRAKE_FORCE = 120; // Freno de mano mucho más agresivo

    // Speed control
    const rawMaxSpeed = GameState.selectedCar.maxSpeed / 10;

    if (keys.Space) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * (HANDBRAKE_FORCE / rawMaxSpeed));
    } else if (keys.KeyW) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, rawMaxSpeed, delta * (GameState.selectedCar.acceleration / rawMaxSpeed));
    } else if (keys.KeyS) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * (GameState.selectedCar.braking / rawMaxSpeed));
    } else {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * (FRICTION / rawMaxSpeed));
    }

    // Steering control
    const steerDir = Number(keys.KeyD) - Number(keys.KeyA);
    const isMoving = GameState.speed > 0.5;

    if (isMoving && steerDir !== 0) {
      // Dynamic steering using velocity
      if (rigidBodyRef.current) {
        const linvel = rigidBodyRef.current.linvel();
        const targetVelX = steerDir * 15 * (GameState.speed / rawMaxSpeed);
        linvel.x = THREE.MathUtils.lerp(linvel.x, targetVelX, delta * STEERING_SPEED * 3);
        rigidBodyRef.current.setLinvel(linvel, true);
      }
    } else {
      if (rigidBodyRef.current) {
        const linvel = rigidBodyRef.current.linvel();
        linvel.x = THREE.MathUtils.lerp(linvel.x, 0, delta * 10);
        rigidBodyRef.current.setLinvel(linvel, true);
      }
    }

    // Boundary enforcement
    if (rigidBodyRef.current) {
      const currentPos = rigidBodyRef.current.translation();
      if (currentPos.x > MOVEMENT_BOUNDS.maxX) {
        rigidBodyRef.current.setTranslation({ x: MOVEMENT_BOUNDS.maxX, y: currentPos.y, z: currentPos.z }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
      } else if (currentPos.x < MOVEMENT_BOUNDS.minX) {
        rigidBodyRef.current.setTranslation({ x: MOVEMENT_BOUNDS.minX, y: currentPos.y, z: currentPos.z }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
      }
      GameState.playerX = currentPos.x;
    }

    // Tilt (roll) - apply to visual group only
    const targetTilt = steerDir * 0.15;
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -targetTilt, delta * 10);

    // Yaw - apply to visual group only
    // Efecto de derrape (Drift) si el freno de mano está activo
    let targetYaw = steerDir * 0.2;
    if (GameState.isHandbrake && isMoving) {
      targetYaw = steerDir * 0.65;
    }

    // Assuming car in .glb faces +Z, we rotate by Math.PI to make it face -Z (away from camera)
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -targetYaw + Math.PI, delta * (GameState.isHandbrake ? 12 : 8));
  });

  const handleCollision = (e) => {
    const otherName = e.other?.rigidBodyObject?.name || "Sin nombre";

    // Ignore collision with the ground
    if (otherName === "ground") {
      return;
    }

    console.log("💥 COLISIÓN DETECTADA CON:", otherName);

    // If it hits a traffic car, trigger Game Over
    GameState.isGameOver = true;
    if (otherName === "police_car") {
      GameState.gameOverReason = 'police';
    } else {
      GameState.gameOverReason = 'crash';
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      position={[GameState.playerX || 0, -0.5, 0]}
      enabledTranslations={[true, true, false]} // Lock Z so it doesn't get pushed back infinitely
      enabledRotations={[false, false, false]} // Lock physical rotations to prevent flip bugs
      canSleep={false}
      onCollisionEnter={handleCollision}
      mass={1500}
    >
      <CuboidCollider args={[0.6, 0.6, 1.375]} position={[0, 0.6, 0]} />
      <group ref={groupRef} rotation={[0, Math.PI, 0]}>
        <Suspense fallback={null}>
          <CarModel modelPath={GameState.selectedCar.model} />
        </Suspense>
      </group>
    </RigidBody>
  );
}
