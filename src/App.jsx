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
  const [bgmVolume, setBgmVolume] = useState(GameState.bgmVolume);
  const [bgmMuted, setBgmMuted] = useState(GameState.bgmMuted);

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    GameState.bgmVolume = val;
    setBgmVolume(val);
  };

  const toggleMute = () => {
    GameState.bgmMuted = !GameState.bgmMuted;
    setBgmMuted(GameState.bgmMuted);
  };

  const renderVolumeControl = () => (
    <div className="volume-control-container" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="mute-btn" onClick={toggleMute}>
        {bgmMuted ? '🔇' : '🔊'}
      </button>
      <input 
        type="range" 
        min="0" max="1" step="0.01" 
        value={bgmVolume} 
        onChange={handleVolumeChange} 
        className="volume-slider"
      />
    </div>
  );

  useEffect(() => {
    // --- Background Music Logic ---
    const bgm = new Audio('/sounds/Midnight_Asphalt.mp3');
    bgm.loop = true;
    bgm.volume = 0; // Start at 0 to prevent sudden blasts
    let audioStarted = false;

    const tryPlayAudio = () => {
      if (!audioStarted) {
        bgm.play().then(() => {
          audioStarted = true;
        }).catch(() => {
          // Requires user interaction first
        });
      }
    };

    // Intentar reproducirlo de inmediato nada más cargar (algunos navegadores lo permiten si recargas mucho la página)
    tryPlayAudio();

    // Attach interaction listeners to bypass browser autoplay restrictions
    document.addEventListener('click', tryPlayAudio);
    document.addEventListener('keydown', tryPlayAudio);

    const audioInterval = setInterval(() => {
      if (audioStarted) {
        bgm.muted = GameState.bgmMuted; // Silencia o restaura al instante
        
        // 0.5 volume for menus/paused, 0.15 for active gameplay
        const targetVolBase = (GameState.isMenu || GameState.isPaused || GameState.isGameOver) ? 0.4 : 0.12;
        const targetVol = targetVolBase * GameState.bgmVolume;
        
        let nextVol = bgm.volume + (targetVol - bgm.volume) * 0.1; // Smooth interpolation
        if (nextVol < 0) nextVol = 0;
        if (nextVol > 1) nextVol = 1;
        bgm.volume = nextVol;
      }
    }, 100);

    return () => {
      document.removeEventListener('click', tryPlayAudio);
      document.removeEventListener('keydown', tryPlayAudio);
      clearInterval(audioInterval);
      bgm.pause();
      bgm.src = '';
    };
  }, []);

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
      if (document.hidden && !GameState.isGameOver && !GameState.isMenu) {
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
            <h1 className="main-menu-title">THE ALGAR ROAD</h1>

            <div className="controls-info">
              <div className="control-row">
                <kbd>W</kbd> <span>Acelerar</span>
              </div>
              <div className="control-row">
                <kbd>A</kbd> <kbd>D</kbd> <span>Girar</span>
              </div>
              <div className="control-row">
                <kbd>S</kbd> <span>Frenar</span>
              </div>
              <div className="control-row">
                <kbd className="kbd-space">Espacio</kbd> <span>Freno de mano</span>
              </div>
              <div className="control-row">
                <kbd className="kbd-esc">ESC</kbd> <span>Pausa/Reanudar</span>
              </div>
            </div>

            {renderVolumeControl()}

            <button type="button" onClick={handleStartGame} className="play-btn">
              JUGAR
            </button>
          </div>
        </div>
      )}


      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h1>{GameState.gameOverReason === 'police' ? '¡La policía te ha atrapado por ir muy lento!' : '¡Has chocado!'}</h1>
            <p>Distancia recorrida: {score}m</p>
            <button type="button" onClick={handleRestart} className="restart-btn">
              Volver a jugar
            </button>
          </div>
        </div>
      )}

      {isPaused && !isGameOver && !isMenu && (
        <div className="pause-overlay">
          <div className="pause-modal">
            <h1>Juego en Pausa</h1>
            <p>Pulsa ESC para continuar</p>
            {renderVolumeControl()}
            <button type="button" onClick={() => { GameState.isPaused = false; setIsPaused(false); }} className="restart-btn">
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
