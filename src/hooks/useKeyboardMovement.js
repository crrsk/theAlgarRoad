import { useEffect, useRef } from 'react';

const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const KEY_MAPPING = {
  'ArrowUp': 'KeyW',
  'ArrowDown': 'KeyS',
  'ArrowLeft': 'KeyA',
  'ArrowRight': 'KeyD'
};

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
      if (shouldIgnoreKeyboardEvent(event)) return;
      if (!MOVEMENT_CODES.has(event.code)) {
        // Si pulsamos una tecla que no es de movimiento (ej. Alt, Meta), podría bloquear keyups
        // Limpiamos todo por seguridad si es una tecla del sistema (opcional, pero blur suele bastar)
        return;
      }

      // No hacemos preventDefault en keyup para evitar bugs en algunos navegadores
      if (isPressed) {
        event.preventDefault();
      }

      const targetKey = KEY_MAPPING[event.code] || event.code;

      // Lógica anti-stuck: Si pulsamos una dirección, forzamos la contraria a false
      if (isPressed) {
        if (targetKey === 'KeyA') pressedKeysRef.current['KeyD'] = false;
        if (targetKey === 'KeyD') pressedKeysRef.current['KeyA'] = false;
        if (targetKey === 'KeyW') pressedKeysRef.current['KeyS'] = false;
        if (targetKey === 'KeyS') pressedKeysRef.current['KeyW'] = false;
      }

      pressedKeysRef.current[targetKey] = isPressed;
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
    window.addEventListener('contextmenu', clearKeys); // Limpiar si hacen click derecho

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
      window.removeEventListener('contextmenu', clearKeys);
    };
  }, []);

  return pressedKeysRef;
}
