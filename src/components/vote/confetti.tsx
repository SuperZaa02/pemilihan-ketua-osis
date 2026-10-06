"use client";

import styles from "./confetti.module.css";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];
const PARTICLE_COUNT = 36;

export function Confetti() {
  return (
    <div className={styles.container} aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
        const distance = 100 + ((index * 37) % 140);
        const x = Math.round(Math.cos(angle) * distance);
        const y = Math.round(Math.sin(angle) * distance - 100);

        return (
          <span
            key={index}
            className={styles.particle}
            style={
              {
                "--x": `${x}px`,
                "--y": `${y}px`,
                "--color": COLORS[index % COLORS.length],
                "--delay": `${(index % 6) * 25}ms`,
                "--rotation": `${360 + ((index * 73) % 720)}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
