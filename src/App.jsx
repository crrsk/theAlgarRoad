import { useState, useEffect } from 'react';
import { Loader } from '@react-three/drei';
import GameScene from './components/scene/GameScene';
import { useSceneTheme } from './hooks/useSceneTheme';
import { GameState } from './gameState';
import Speedometer from './components/ui/Speedometer';
import { getPlayerProfile, createPlayerProfile, updatePlayerProfile, addExperience, getXpProgress } from './utils/playerProfile';
import { CARS_CONFIG, getCarById } from './utils/carsConfig';
import Garage3DView from './components/ui/Garage3DView';
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

  const [profile, setProfile] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [leveledUp, setLeveledUp] = useState(false);
  const [xpGainedLastGame, setXpGainedLastGame] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [garageCarIndex, setGarageCarIndex] = useState(0);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [xpParticles, setXpParticles] = useState([]);

  useEffect(() => {
    const existingProfile = getPlayerProfile();
    if (existingProfile) {
      setProfile(existingProfile);
      setAnimatedXp(existingProfile.xp);
      GameState.selectedCar = getCarById(existingProfile.selectedCarId);
    } else {
      setShowNameInput(true);
    }
  }, []);

  useEffect(() => {
    if (isGameOver && profile && animatedXp < profile.xp) {
      const diff = profile.xp - animatedXp;
      const step = Math.max(1, Math.ceil(diff / 20)); // Slow down as it gets closer
      
      const timer = setTimeout(() => {
        setAnimatedXp(prev => Math.min(profile.xp, prev + step));
      }, 30);
      
      return () => clearTimeout(timer);
    }
  }, [isGameOver, animatedXp, profile]);

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
          const finalScore = Math.floor(GameState.distance);
          setScore(finalScore);
          
          if (finalScore > 0) {
            const previousXp = profile ? profile.xp : 0;
            const result = addExperience(finalScore);
            if (result) {
              setProfile(result.updatedProfile);
              setLeveledUp(result.leveledUp);
              setXpGainedLastGame(finalScore);
              setAnimatedXp(previousXp);
              
              // Generar partículas de XP
              const newParticles = Array.from({ length: 25 }).map((_, i) => ({
                id: i,
                delay: Math.random() * 0.6,
                endX: (Math.random() - 0.5) * 300,
                endY: 70 + Math.random() * 15,
                midX: (Math.random() - 0.5) * 150,
                midY: (Math.random() - 0.5) * 50 - 20,
              }));
              setXpParticles(newParticles);
            }
          } else {
            setXpGainedLastGame(0);
            setLeveledUp(false);
          }
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
    setLeveledUp(false);
    setXpGainedLastGame(0);
    setGameId(prevId => prevId + 1);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!playerNameInput.trim()) return;
    
    if (isEditingName && profile) {
      const updated = updatePlayerProfile({ name: playerNameInput.trim() });
      setProfile(updated);
      setIsEditingName(false);
    } else {
      const newProfile = createPlayerProfile(playerNameInput.trim());
      setProfile(newProfile);
      GameState.selectedCar = getCarById(newProfile.selectedCarId);
      setShowNameInput(false);
    }
  };

  const handleOpenGarage = () => {
    // Find the index of the currently selected car to show it first
    const currentIndex = CARS_CONFIG.findIndex(c => c.id === profile.selectedCarId);
    setGarageCarIndex(currentIndex !== -1 ? currentIndex : 0);
    setShowGarage(true);
  };

  const handleSelectCar = (car) => {
    if (profile.level >= car.unlockLevel) {
      const updated = updatePlayerProfile({ selectedCarId: car.id });
      setProfile(updated);
      GameState.selectedCar = car;
      setShowGarage(false);
      
      // Si estamos en pausa y cambiamos de coche, reiniciamos la carrera
      if (isPaused) {
        handleRestart();
      }
    }
  };

  const handlePrevCar = () => {
    setGarageCarIndex(prev => (prev > 0 ? prev - 1 : CARS_CONFIG.length - 1));
  };

  const handleNextCar = () => {
    setGarageCarIndex(prev => (prev < CARS_CONFIG.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <GameScene
        key={gameId}
        sceneTheme={sceneTheme}
      />

      <Loader />

      {!isMenu && !isGameOver && <Speedometer />}

      {showNameInput && isMenu && !isEditingName && (
        <div className="name-input-overlay">
          <div className="name-input-modal">
            <h1>NUEVO PILOTO</h1>
            <p>Introduce tu nombre para empezar tu carrera.</p>
            <form onSubmit={handleNameSubmit}>
              <input 
                type="text" 
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                placeholder="Tu nombre..."
                maxLength={15}
                autoFocus
              />
              <button type="submit" className="play-btn" disabled={!playerNameInput.trim()}>
                CONFIRMAR
              </button>
            </form>
          </div>
        </div>
      )}

      {isMenu && !showNameInput && (
        <div className="main-menu-overlay">
          <div className="main-menu-modal">
            <h1 className="main-menu-title">THE ALGAR ROAD</h1>
            
            {profile && (
              <div className="profile-section">
                <div className="profile-info">
                  {!isEditingName ? (
                    <>
                      <span className="profile-name">{profile.name}</span>
                      <button className="edit-name-btn" onClick={() => { setIsEditingName(true); setPlayerNameInput(profile.name); }}>✏️</button>
                    </>
                  ) : (
                    <form onSubmit={handleNameSubmit} className="edit-name-form">
                      <input 
                        type="text" 
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                        maxLength={15}
                        autoFocus
                      />
                      <button type="submit">OK</button>
                      <button type="button" onClick={() => setIsEditingName(false)}>X</button>
                    </form>
                  )}
                </div>
                <div className="profile-stats">
                  <span className="profile-level">NIVEL {profile.level}</span>
                  <span className="profile-xp">XP {profile.xp}</span>
                </div>
              </div>
            )}

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

            <button type="button" onClick={handleOpenGarage} className="play-btn garage-btn">
              GARAJE
            </button>
            <button type="button" onClick={handleStartGame} className="play-btn">
              JUGAR
            </button>
          </div>
        </div>
      )}

      {showGarage && (isMenu || isPaused) && profile && (
        <div className="garage-overlay">
          <div className="garage-modal">
            <h1>GARAJE</h1>
            <p>Selecciona tu vehículo para la carrera</p>
            
            <div className="garage-3d-layout">
              <button type="button" className="garage-nav-btn" onClick={handlePrevCar}>◀</button>
              
              <div className="garage-center-view">
                <Garage3DView carConfig={CARS_CONFIG[garageCarIndex]} />
                
                <div className="garage-car-info">
                  {(() => {
                    const car = CARS_CONFIG[garageCarIndex];
                    const isUnlocked = profile.level >= car.unlockLevel;
                    const isSelected = profile.selectedCarId === car.id;
                    
                    return (
                      <div className="car-details">
                        <div className="car-details-header">
                          <h2>{car.name}</h2>
                          {!isUnlocked && <span className="lock-icon">🔒 Lvl {car.unlockLevel}</span>}
                          {isSelected && <span className="selected-icon">✅ SELECCIONADO</span>}
                        </div>
                        
                        <div className="car-stats large-stats" style={{ display: 'none' }}>
                        </div>

                        {isUnlocked && !isSelected && (
                          <button type="button" onClick={() => handleSelectCar(car)} className="play-btn select-car-btn">
                            SELECCIONAR
                          </button>
                        )}
                        {!isUnlocked && (
                          <button type="button" className="play-btn select-car-btn locked" disabled>
                            BLOQUEADO
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <button type="button" className="garage-nav-btn" onClick={handleNextCar}>▶</button>
            </div>
            
            <button type="button" onClick={() => setShowGarage(false)} className="close-btn">
              CERRAR
            </button>
          </div>
        </div>
      )}


      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h1>{GameState.gameOverReason === 'police' ? '¡La policía te ha atrapado por ir muy lento!' : '¡Has chocado!'}</h1>
            <p>Distancia recorrida: {score}m</p>
            {xpGainedLastGame > 0 && (
              <div className="xp-gain-info" style={{ position: 'relative' }}>
                <p className="xp-text">+{xpGainedLastGame} XP</p>
                {leveledUp && <p className="level-up-text">¡NUEVO NIVEL {profile?.level}!</p>}
                
                {xpParticles.map(p => (
                  <div key={p.id} className="xp-particle" style={{
                    '--mid-x': `${p.midX}px`,
                    '--mid-y': `${p.midY}px`,
                    '--end-x': `${p.endX}px`,
                    '--end-y': `${p.endY}px`,
                    animationDelay: `${p.delay}s`
                  }}></div>
                ))}
                
                {profile && (
                  <div className="xp-progress-container">
                    <div className="xp-progress-bar">
                      <div className="xp-progress-fill" style={{ width: `${getXpProgress(animatedXp).progressPercentage}%` }}></div>
                    </div>
                    <p className="xp-progress-text">
                      {getXpProgress(animatedXp).xpInLevel} / {getXpProgress(animatedXp).xpNeededForNext} XP al siguiente nivel
                    </p>
                  </div>
                )}
              </div>
            )}
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
            <button type="button" onClick={handleOpenGarage} className="restart-btn garage-btn" style={{ marginRight: '1.5rem' }}>
              GARAJE
            </button>
            <button type="button" onClick={() => { GameState.isPaused = false; setIsPaused(false); }} className="restart-btn">
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
