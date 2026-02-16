import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, LinearProgress, Paper, Avatar } from '@mui/material';
import { PlayArrow, Pause, SkipNext } from '@mui/icons-material';
import { getCurrentTrack, play, pause, next } from '../../services/spotifyService';
import { useNavigate } from 'react-router-dom';

// 1. Define the Interface matching your Backend's NEW transformed response
interface TrackData {
  isPlaying: boolean;
  progressMs: number;
  item: {
    id: string;
    name: string;
    artists: string[]; 
    albumArt: string;  
    durationMs: number; 
  };
}

interface Props { userId: string; }

const MiniPlayer: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  
  const [track, setTrack] = useState<TrackData | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchTrack = async () => {
    try {
        // FIX: Use 'as unknown as TrackData' to override the type mismatch error
        const data = (await getCurrentTrack(userId)) as unknown as TrackData;
        
        if (data && data.item) {
            setTrack(data);
            const pct = (data.progressMs / data.item.durationMs) * 100;
            setProgress(pct > 100 ? 100 : pct);
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTrack();
    const interval = setInterval(fetchTrack, 4000); 
    return () => clearInterval(interval);
  }, [userId]);

  if (!track || !track.item) return null;

  return (
    <Paper 
      elevation={10}
      sx={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        height: 80, bgcolor: '#282828', zIndex: 1000,
        display: 'flex', alignItems: 'center', px: 2,
        borderTop: '1px solid #121212'
      }}
    >
      {/* Track Info */}
      <Box 
        sx={{ display: 'flex', alignItems: 'center', width: '30%', cursor: 'pointer' }}
        onClick={() => navigate('/player')}
      >
         <Avatar 
            src={track.item.albumArt} 
            variant="rounded" 
            sx={{ width: 56, height: 56, mr: 2 }} 
         />
         <Box>
             <Typography variant="subtitle2" noWrap fontWeight="bold" sx={{ color: 'white' }}>
                 {track.item.name}
             </Typography>
             <Typography variant="caption" color="text.secondary" noWrap>
                 {track.item.artists.join(', ')}
             </Typography>
         </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
         <IconButton onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause(userId).then(fetchTrack) : play(userId).then(fetchTrack); }} sx={{ color: 'white' }}>
            {track.isPlaying ? <Pause /> : <PlayArrow />}
         </IconButton>
         <IconButton onClick={(e) => { e.stopPropagation(); next(userId).then(fetchTrack); }} sx={{ color: 'white' }}>
            <SkipNext />
         </IconButton>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
         <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: '#1DB954' } }} 
         />
      </Box>
    </Paper>
  );
};

export default MiniPlayer;