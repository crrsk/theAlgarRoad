import { useEffect, useState } from 'react';
import { getSpainSceneTheme } from '../utils/sceneTheme';

export function useSceneTheme() {
  const [sceneTheme, setSceneTheme] = useState(getSpainSceneTheme);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSceneTheme(getSpainSceneTheme());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return sceneTheme;
}
