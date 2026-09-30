'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setProgress(Math.min((window.scrollY / scrollHeight) * 100, 100));
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
      <div
        className="relative h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #b45309, #d97706, #f59e0b)',
          boxShadow: '0 0 8px rgba(217,119,6,.55)',
        }}>
        <span
          className="absolute -right-1 -top-[2.5px] h-2 w-2 rounded-full"
          style={{ background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,.9)' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
