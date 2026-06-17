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

    // Set shadows to FALSE to vastly improve performance
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        // Optionally simplify materials here if needed
      }
    });
    return clone;
  }, [scene, modelPath]);

  return <primitive object={clonedScene} />;
}
