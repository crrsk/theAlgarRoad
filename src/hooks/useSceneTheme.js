import { useState } from 'react';
import { getRandomCityTheme } from '../utils/sceneTheme';
import { GameState } from '../gameState';

export function useSceneTheme() {
  const [sceneTheme] = useState(() => {
    const theme = getRandomCityTheme();
    GameState.sceneTheme = theme.type;
    return theme;
  });
  return sceneTheme;
}
