import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

// Configuración global para normalizar todos los modelos
export const VEHICLE_CONFIG = [
  { path: '/CochesCirculacion/Bus.glb', length: 6.5, rotationOffset: 0 },
  { path: '/CochesCirculacion/Jeep.glb', length: 3.5, rotationOffset: 0 },
  { path: '/CochesCirculacion/Pickup Truck.glb', length: 3.5, rotationOffset: 0 },
  { path: '/CochesCirculacion/Police Car.glb', length: 3.0, rotationOffset: 0 },
  { path: '/CochesCirculacion/Red Car.glb', length: 3.0, rotationOffset: Math.PI }, // El coche rojo venía del revés de fábrica
  { path: '/CochesCirculacion/Sports Car.glb', length: 3.0, rotationOffset: 0 },
];

VEHICLE_CONFIG.forEach((config) => useGLTF.preload(config.path));

export default function TrafficCar({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // Buscar la configuración de este modelo específico
    const config = VEHICLE_CONFIG.find(c => c.path === modelPath) || { length: 3.0, rotationOffset: 0 };
    
    // Auto-scale model so its length/width isn't excessively huge
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.z);
    const scaleFactor = config.length / maxDim;
    clone.scale.setScalar(scaleFactor);
    
    // Recompute box after scale
    const scaledBox = new THREE.Box3().setFromObject(clone);
    // Shift model up so its lowest point (tires) is exactly at Y=0
    clone.position.y = -scaledBox.min.y;

    // Aplicar la corrección de rotación si el modelo venía girado de fábrica
    if (config.rotationOffset) {
      clone.rotation.y = config.rotationOffset;
    }

    // Set shadows to FALSE to vastly improve performance and disable built-in lights
    clone.traverse((child) => {
      if (child.isLight) {
        child.intensity = 0;
        child.visible = false;
      }
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    clone.updateMatrixWorld(true);
    const finalBox = new THREE.Box3();
    clone.traverse((child) => {
      if (child.isMesh && child.visible && (!child.material || child.material.transparent !== true)) {
        const name = child.name.toLowerCase();
        if (!name.includes('shadow') && !name.includes('plane') && !name.includes('ground') && !name.includes('bound')) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          finalBox.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld));
        }
      }
      
      // Iluminar los faros traseros/delanteros nativos
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
            child.material.emissiveIntensity = 8;
            child.material.toneMapped = false;
        } else if ((isLight && isFront) || isWhiteEmissive) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(0xfff0dd);
            child.material.emissiveIntensity = 5;
            child.material.toneMapped = false;
        }
      }
    });

    return clone;
  }, [scene, modelPath]);

  return <primitive object={clonedScene} />;
}
