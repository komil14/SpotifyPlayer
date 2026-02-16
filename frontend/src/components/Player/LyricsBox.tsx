import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { LyricLine } from '../../utils/lyricsParser';

interface Props {
  lyrics: LyricLine[];
  progressMs: number;
  onLineClick: (startTime: number) => void;
}

const LyricsBox: React.FC<Props> = ({ lyrics, progressMs, onLineClick }) => {
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].time <= progressMs) {
      activeIndex = i;
      break;
    }
  }

  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        py: 4,
        px: 2,
        textAlign: 'center',
        '&::-webkit-scrollbar': { display: 'none' },
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none', 
        scrollBehavior: 'smooth',
        // Mask fade at top and bottom
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        return (
          <Typography
            key={index}
            ref={isActive ? activeRef : null}
            onClick={() => onLineClick(line.time)} 
            sx={{
              py: 1.5,
              fontFamily: '"Circular Std", sans-serif',
              fontWeight: isActive ? 800 : 500,
              fontSize: isActive ? '1.6rem' : '1.1rem',
              // GLOW EFFECT
              color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)', 
              textShadow: isActive ? '0 0 20px rgba(29, 185, 84, 0.6)' : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy
              cursor: 'pointer',
              '&:hover': { color: 'white', opacity: 1 }
            }}
          >
            {line.text}
          </Typography>
        );
      })}
    </Box>
  );
};

export default LyricsBox;