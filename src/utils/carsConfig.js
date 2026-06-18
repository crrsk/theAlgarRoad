// carsConfig.js
// Configuración de todos los coches disponibles en el juego

export const CARS_CONFIG = [
  {
    id: 'rookie_red',
    name: 'Rookie Red',
    model: '/CochesCirculacion/Red Car.glb',
    rotationOffset: Math.PI,
    unlockLevel: 1,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  },
  {
    id: 'offroad_jeep',
    name: 'Off-Road Jeep',
    model: '/CochesCirculacion/Jeep.glb',
    unlockLevel: 3,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  },
  {
    id: 'heavy_pickup',
    name: 'Heavy Pickup',
    model: '/CochesCirculacion/Pickup Truck.glb',
    unlockLevel: 5,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  },
  {
    id: 'interceptor',
    name: 'Interceptor',
    model: '/CochesCirculacion/Police Car.glb',
    unlockLevel: 7,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  },
  {
    id: 'sports_gt',
    name: 'Sports GT',
    model: '/CochesCirculacion/Sports Car.glb',
    unlockLevel: 9,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  },
  {
    id: 'algar_beast',
    name: 'Algar Beast',
    model: '/car.glb',
    unlockLevel: 12,
    maxSpeed: 300,
    acceleration: 60,
    braking: 70
  }
];

export function getCarById(id) {
  return CARS_CONFIG.find(car => car.id === id) || CARS_CONFIG[0];
}
