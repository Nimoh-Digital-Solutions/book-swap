import { useReducedMotion } from 'motion/react';
import { motion } from 'motion/react';

import styles from './BackgroundPaths.module.scss';

interface FloatingPathsProps {
  position: number;
}

function FloatingPaths({ position }: FloatingPathsProps) {
  const prefersReducedMotion = useReducedMotion();

  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className={styles.pathContainer} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox="0 0 696 316"
        fill="none"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={
              prefersReducedMotion
                ? { pathLength: 1, opacity: 0.4 }
                : {
                    pathLength: 1,
                    opacity: [0.3, 0.6, 0.3],
                    pathOffset: [0, 1, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 20 + Math.random() * 10,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}

export interface BackgroundPathsProps {
  className?: string;
}

/**
 * BackgroundPaths
 *
 * Animated 36-path SVG overlay for the auth panel dark side.
 * Respects `prefers-reduced-motion`.
 */
export function BackgroundPaths({ className }: BackgroundPathsProps) {
  return (
    <div className={`${styles.root}${className ? ` ${className}` : ''}`} aria-hidden="true">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}
