import { useEffect, useRef } from 'react';
import { GameState } from '../../gameState';
import './Speedometer.css';

export default function Speedometer() {
  const needleRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const updateSpeed = () => {
      // Velocidad real del juego multiplicada para mostrar km/h (máx ~300)
      const speedRaw = GameState.speed;
      const kmh = Math.min(320, Math.max(0, Math.floor(speedRaw * 10)));
      
      // Actualizar texto digital
      if (textRef.current) {
        textRef.current.textContent = `${kmh}`;
      }
      
      // Actualizar la aguja (Mapear 0-320 km/h a ángulos -130 a 130 grados)
      if (needleRef.current) {
        const minAngle = -130;
        const maxAngle = 130;
        const angle = minAngle + (kmh / 320) * (maxAngle - minAngle);
        needleRef.current.style.transform = `rotate(${angle}deg)`;
      }

      animationFrameId = requestAnimationFrame(updateSpeed);
    };

    updateSpeed();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Generar las marcas de velocidad (ticks) estáticamente
  const ticks = [];
  for (let i = 0; i <= 320; i += 20) {
    const angle = -130 + (i / 320) * 260;
    const isMajor = i % 40 === 0; // Números cada 40 km/h
    const isRedline = i >= 240; // Zona roja a partir de 240 km/h
    
    ticks.push(
      <div 
        key={i} 
        className={`tick ${isMajor ? 'major' : 'minor'} ${isRedline ? 'redline' : ''}`} 
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {isMajor && (
          <span className="tick-label" style={{ transform: `rotate(${-angle}deg) translateX(-50%)` }}>
            {i}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="speedometer-widget">
      <div className="speedometer-face">
        {ticks}
        <div className="needle-container" ref={needleRef}>
          <div className="needle"></div>
          <div className="needle-center"></div>
        </div>
        <div className="digital-readout">
          <span ref={textRef} className="digital-speed">0</span>
          <span className="digital-unit">km/h</span>
        </div>
      </div>
    </div>
  );
}
