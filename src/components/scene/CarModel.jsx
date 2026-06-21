import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';
import { CARS_CONFIG } from '../../utils/carsConfig';
import Headlights from './Headlights';

export default function CarModel({ modelPath, isGarage = false }) {
  // Use a default fallback if modelPath is undefined for some reason during initial render
  const safeModelPath = modelPath || '/car.glb';
  const { scene: originalScene } = useGLTF(safeModelPath);
  const wheelsRef = useRef([]);

  const scene = useMemo(() => {
    // Clone the scene to avoid mutating the globally cached useGLTF instance.
    // This prevents compounding transformations on remounts.
    const cloned = originalScene.clone();
    
    // Auto-scale the car so it's not too huge or tiny
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
       const targetScale = 2.75 / maxDim;
       cloned.scale.setScalar(targetScale);
    }
    
    // Update matrices to calculate bounding box correctly after scaling
    cloned.updateMatrixWorld(true);
    let lowestY = Infinity;
    
    cloned.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         const wheelBox = new THREE.Box3().setFromObject(child);
         if (wheelBox.min.y < lowestY) lowestY = wheelBox.min.y;
      }
    });
    
    if (lowestY === Infinity) {
       const box2 = new THREE.Box3().setFromObject(cloned);
       lowestY = box2.min.y;
    }

    // This completely avoids the production bug where parent matrices are stale during useEffect.
    cloned.position.y -= lowestY;
    
    // Apply rotation offset if the model came inverted from factory (e.g. Red Car)
    const config = CARS_CONFIG.find(c => c.model === safeModelPath);
    if (config && config.rotationOffset) {
      cloned.rotation.y = config.rotationOffset;
    }
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         // Clone geometry so we don't mess up shared geometries across all 4 wheels
         child.geometry = child.geometry.clone();
         
         // Find local center of the geometry
         child.geometry.computeBoundingBox();
         const center = new THREE.Vector3();
         child.geometry.boundingBox.getCenter(center);
         
         // Shift the vertices so the wheel's origin is exactly at its center
         child.geometry.translate(-center.x, -center.y, -center.z);
         
         // Shift the object's position to compensate, applying scale and rotation to move in parent space
         const offset = center.clone().multiply(child.scale).applyQuaternion(child.quaternion);
         child.position.add(offset);
      }
    });

    cloned.updateMatrixWorld(true);
    
    // Calculamos el Bounding Box muy estricto y apagamos luces nativas
    const finalBox = new THREE.Box3();
    cloned.traverse((child) => {
      // 1. Si el modelo traía una luz de fábrica (faros horteras de Blender), la destruimos
      if (child.isLight) {
         child.intensity = 0;
         child.visible = false;
         child.castShadow = false;
      }
      
      // 2. Solo usamos mallas 100% visibles y opacas para la chapa del coche
      if (child.isMesh && child.visible && (!child.material || child.material.transparent !== true)) {
        const name = child.name.toLowerCase();
        // Filtramos cajas de colisión y planos de sombra
        if (!name.includes('shadow') && !name.includes('plane') && !name.includes('ground') && !name.includes('bound')) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
          finalBox.union(worldBox);
        }
      }
      
      // 3. Identificar las luces traseras y delanteras nativas del modelo para animarlas en la noche
      if (child.isMesh && child.material) {
        const meshName = child.name.toLowerCase();
        const matName = child.material.name ? child.material.name.toLowerCase() : '';
        
        const isLight = meshName.includes('light') || matName.includes('light') || meshName.includes('lamp') || matName.includes('faro') || matName.includes('glass') || meshName.includes('glass');
        const isRear = meshName.includes('tail') || meshName.includes('rear') || meshName.includes('brake') || meshName.includes('back') || matName.includes('tail') || matName.includes('rear') || matName.includes('freno') || meshName.includes('freno');
        const isFront = meshName.includes('head') || meshName.includes('front') || matName.includes('head') || matName.includes('delanter') || meshName.includes('delanter');
        
        const isRedEmissive = child.material.emissive && child.material.emissive.r > 0.5 && child.material.emissive.g < 0.2;
        const isWhiteEmissive = child.material.emissive && child.material.emissive.r > 0.8 && child.material.emissive.g > 0.8 && child.material.emissive.b > 0.8;
        
        if ((isLight && isRear) || isRedEmissive) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(0xff0000);
            child.material.emissiveIntensity = 0; // Empiezan apagadas
            child.material.toneMapped = false;
            
            if (!cloned.userData.tailMaterials) cloned.userData.tailMaterials = [];
            cloned.userData.tailMaterials.push(child.material);
        } else if ((isLight && isFront) || isWhiteEmissive) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(0xfff0dd);
            child.material.emissiveIntensity = 0; // Empiezan apagadas
            child.material.toneMapped = false;
            
            if (!cloned.userData.headMaterials) cloned.userData.headMaterials = [];
            cloned.userData.headMaterials.push(child.material);
        }
      }
    });

    cloned.userData.bounds = {
      // Retrasamos el punto levemente (-0.05) para meter la luz dentro de la chapa y que no flote
      frontZ: finalBox.max.z - 0.05, 
      backZ: finalBox.min.z + 0.05,
      leftX: finalBox.max.x - 0.25,
      rightX: finalBox.min.x + 0.25,
      y: finalBox.min.y + (finalBox.max.y - finalBox.min.y) * 0.40
    };

    return cloned;
  }, [originalScene, safeModelPath]);

  useEffect(() => {
    wheelsRef.current = [];
    scene.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         wheelsRef.current.push(child);
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
     if (GameState.isPaused || GameState.isMenu || GameState.isGameOver || isGarage) return;

     wheelsRef.current.forEach(wheel => {
         // Bloquear ruedas motrices (traseras) si el freno de mano está puesto
         // Asumimos que la trasera del coche es la parte negativa del eje Z local
         if (GameState.isHandbrake && wheel.position.z < 0) {
             return;
         }
         
         // Assuming rotation on X moves the wheel forward
         wheel.rotation.x -= GameState.speed * delta * 2;
     });

     // Animar las luces traseras y delanteras nativas
     const t = GameState.transitionProgress;
     const isNightTarget = GameState.targetBiome === 'retrowave' || GameState.sceneTheme === 'night';
     const isNightCurrent = GameState.currentBiome === 'retrowave' || GameState.sceneTheme === 'night';
     
     const tailIntensityA = isNightCurrent ? 12.0 : 0.0;
     const tailIntensityB = isNightTarget ? 12.0 : 0.0;
     const currentTail = THREE.MathUtils.lerp(tailIntensityA, tailIntensityB, t);

     const headIntensityA = isNightCurrent ? 8.0 : 0.0;
     const headIntensityB = isNightTarget ? 8.0 : 0.0;
     const currentHead = THREE.MathUtils.lerp(headIntensityA, headIntensityB, t);

     if (scene.userData.tailMaterials) {
         scene.userData.tailMaterials.forEach(mat => mat.emissiveIntensity = currentTail);
     }
     if (scene.userData.headMaterials) {
         scene.userData.headMaterials.forEach(mat => mat.emissiveIntensity = currentHead);
     }
  });

  return (
    <group>
      <primitive object={scene} />
      {!isGarage && <Headlights isTraffic={false} bounds={scene.userData.bounds} />}
    </group>
  );
}

// Preload all cars to avoid hitches when swapping in the garage
CARS_CONFIG.forEach(car => {
  useGLTF.preload(car.model);
});
