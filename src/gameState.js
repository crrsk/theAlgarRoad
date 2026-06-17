export const GameState = {
  speed: 0,
  isMenu: true,
  isGameOver: false,
  isPaused: false,
  playerX: 0,
  distance: 0,
  reset() {
    this.speed = 0;
    this.isMenu = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.distance = 0;
  }
};
