import { useEffect, useRef } from 'react';
import './LiquidLight.css';

/**
 * LiquidLight — ambient "developing tray" background.
 * Slow, viscous blobs of color drifting like ink/light leaks in a chemical bath.
 * `pulse` prop (0-1, transient) lets parent trigger a ripple (e.g. on rating a star).
 */
export default function LiquidLight({ variant = 'void', intensity = 1, className = '' }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty('--intensity', intensity);
  }, [intensity]);

  return (
    <div ref={rootRef} className={`liquid-light liquid-light--${variant} ${className}`} aria-hidden="true">
      <div className="liquid-light__blob liquid-light__blob--a" />
      <div className="liquid-light__blob liquid-light__blob--b" />
      <div className="liquid-light__blob liquid-light__blob--c" />
      <div className="liquid-light__grain" />
    </div>
  );
}
