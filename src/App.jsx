import { useState, useEffect } from 'react';
import GameScene from './components/scene/GameScene';
import { useSceneTheme } from './hooks/useSceneTheme';
import { GameState } from './gameState';
import './App.css';
import './index.css';

export default function App() {
  const sceneTheme = useSceneTheme();

  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
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
      if (e.key === 'Escape' && !GameState.isGameOver) {
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
  }, [isGameOver, isPaused]);

  const handleRestart = () => {
    // Un-mount the TrafficManager's active cars by reloading the page is the simplest and most robust way
    // But since this is React, we can dispatch a custom event, or rely on GameState.reset() which we implemented.
    // However, TrafficManager doesn't clear its 'cars' state on reset yet.
    // We can dispatch an event to clear cars, or just reload the window.
    window.location.reload();
  };

  return (
    <>
      <GameScene
        sceneTheme={sceneTheme}
      />


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
