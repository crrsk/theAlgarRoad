export const GameState = {
  speed: 0,
  isGameOver: false,
  isPaused: false,
  playerX: 0,
  distance: 0,
  reset() {
    this.speed = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.distance = 0;
  }
};
