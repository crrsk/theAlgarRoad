import { useEffect, useRef } from 'react';

const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space']);

function shouldIgnoreKeyboardEvent(event) {
  const tagName = event.target?.tagName;

  switch (tagName) {
    case 'INPUT':
    case 'TEXTAREA':
    case 'SELECT':
      return true;

    default:
      return Boolean(event.target?.isContentEditable);
  }
}

export function useKeyboardMovement() {
  const pressedKeysRef = useRef({
    KeyA: false,
    KeyD: false,
    KeyS: false,
    KeyW: false,
    Space: false,
  });

  useEffect(() => {
    const setKeyPressed = (event, isPressed) => {
      if (!MOVEMENT_CODES.has(event.code) || shouldIgnoreKeyboardEvent(event)) return;

      event.preventDefault();
      pressedKeysRef.current[event.code] = isPressed;
    };

    const handleKeyDown = (event) => setKeyPressed(event, true);
    const handleKeyUp = (event) => setKeyPressed(event, false);
    const clearKeys = () => {
      pressedKeysRef.current = {
        KeyA: false,
        KeyD: false,
        KeyS: false,
        KeyW: false,
        Space: false,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  return pressedKeysRef;
}
