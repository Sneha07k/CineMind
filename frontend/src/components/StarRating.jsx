import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StarRating.css';

/**
 * Five-star rating control with a liquid "ripple" pulse on selection —
 * echoes the film-developing motif: dropping a rating in is like dropping
 * a drop of light into the bath.
 */
export default function StarRating({ value = 0, onRate, size = 'lg' }) {
  const [hovered, setHovered] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);
  const display = hovered || value;

  const handleRate = (n) => {
    setRippleKey((k) => k + 1);
    onRate?.(n);
  };

  return (
    <div className={`star-rating star-rating--${size}`} role="radiogroup" aria-label="Rate this movie">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="star-rating__btn"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleRate(n)}
        >
          <motion.span
            className={`star-rating__star ${n <= display ? 'is-filled' : ''}`}
            animate={n === value ? { scale: [1, 1.35, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            ★
          </motion.span>
          <AnimatePresence>
            {n === value && (
              <motion.span
                key={rippleKey}
                className="star-rating__ripple"
                initial={{ opacity: 0.6, scale: 0.2 }}
                animate={{ opacity: 0, scale: 2.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </button>
      ))}
    </div>
  );
}
