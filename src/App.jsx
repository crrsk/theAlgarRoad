import { useState, useEffect } from 'react';
import { Loader } from '@react-three/drei';
import GameScene from './components/scene/GameScene';
import { useSceneTheme } from './hooks/useSceneTheme';
import { GameState } from './gameState';
import Speedometer from './components/ui/Speedometer';
import './App.css';
import './index.css';

export default function App() {
  const sceneTheme = useSceneTheme();

  const [gameId, setGameId] = useState(0); // Clave para forzar el reinicio limpio de la escena
  const [isMenu, setIsMenu] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (GameState.isMenu !== isMenu) {
        setIsMenu(GameState.isMenu);
      }
      if (GameState.isGameOver !== isGameOver) {
        setIsGameOver(GameState.isGameOver);
        if (GameState.isGameOver) {
          setScore(Math.floor(GameState.distance));
        }
      }
      if (GameState.isPaused !== isPaused) {
        setIsPaused(GameState.isPaused);
      }
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !GameState.isGameOver && !GameState.isMenu) {
        GameState.isPaused = !GameState.isPaused;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !GameState.isGameOver) {
        GameState.isPaused = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGameOver, isPaused, isMenu]);

  const handleStartGame = () => {
    GameState.isMenu = false;
    setIsMenu(false);
  };

  const handleRestart = () => {
    // Al cambiar el ID, React desmonta y vuelve a montar toda la escena 3D al instante.
    // Como los modelos ya están cacheados, no habrá pantalla de carga y las físicas se reiniciarán limpias.
    GameState.reset();
    setIsGameOver(false);
    setScore(0);
    setGameId(prevId => prevId + 1);
  };

  return (
    <>
      <GameScene
        key={gameId}
        sceneTheme={sceneTheme}
      />

      <Loader />

      {!isMenu && !isGameOver && <Speedometer />}

      {isMenu && (
        <div className="main-menu-overlay">
          <div className="main-menu-modal">
            <h1 className="main-menu-title">The Algar Road</h1>
            <button type="button" onClick={handleStartGame} className="play-btn">
              JUGAR
            </button>
          </div>
        </div>
      )}


      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h1>¡Has chocado!</h1>
            <p>Distancia recorrida: {score}m</p>
            <button type="button" onClick={handleRestart} className="restart-btn">
              Volver a jugar
            </button>
          </div>
        </div>
      )}

      {isPaused && !isGameOver && (
        <div className="pause-overlay">
          <div className="pause-modal">
            <h1>Juego en Pausa</h1>
            <p>Pulsa ESC para continuar</p>
            <button type="button" onClick={() => { GameState.isPaused = false; setIsPaused(false); }} className="restart-btn">
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
