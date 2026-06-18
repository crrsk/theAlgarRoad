import { useState } from 'react';
import { getRandomCityTheme } from '../utils/sceneTheme';

export function useSceneTheme() {
  const [sceneTheme] = useState(getRandomCityTheme);
  return sceneTheme;
}
