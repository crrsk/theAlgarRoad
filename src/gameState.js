export const GameState = {
  speed: 0,
  isMenu: true,
  isGameOver: false,
  gameOverReason: 'crash',
  isPaused: false,
  playerX: 0,
  distance: 0,
  policeRequested: false,
  policeActive: false,
  isTailgating: false,
  isHandbrake: false,
  bgmVolume: 1.0,
  bgmMuted: false,
  selectedCar: {
    maxSpeed: 30, // Default 300 km/h (Algar Beast)
    acceleration: 25,
    braking: 50,
  },
  reset() {
    this.speed = 0;
    this.isMenu = false;
    this.isGameOver = false;
    this.gameOverReason = 'crash';
    this.isPaused = false;
    this.distance = 0;
    this.policeRequested = false;
    this.policeActive = false;
    this.isTailgating = false;
    this.isHandbrake = false;
  }
};
