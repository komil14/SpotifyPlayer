import React from 'react';
import { 
  Container, Typography, Box, Button, Stack, Paper, Chip 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PlayArrow, Mic, Bolt, LibraryMusic } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// 1. Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(29, 185, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: 'white', overflow: 'hidden', position: 'relative' }}>
      
      {/* Background Gradient Blob */}
      <Box sx={{
        position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(29,185,84,0.4) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(100px)', zIndex: 0
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 15, pb: 10 }}>
        
        {/* HERO SECTION */}
        <Stack alignItems="center" textAlign="center" spacing={4}>
          <Chip 
            label="v2.0 Now Live" 
            color="primary" 
            variant="outlined" 
            sx={{ borderColor: '#1DB954', color: '#1DB954', fontWeight: 'bold' }} 
          />
          
          <Typography variant="h1" sx={{ 
            fontWeight: 900, 
            fontSize: { xs: '3rem', md: '5.5rem' },
            background: 'linear-gradient(90deg, #fff 30%, #1DB954 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1
          }}>
            Don't just listen.<br />Perform.
          </Typography>

          <Typography variant="h5" color="gray" maxWidth="md" sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, lineHeight: 1.6 }}>
            The ultimate Spotify companion. Real-time synced lyrics, 
            interactive navigation, and zero distractions. 
            Experience your music library like never before.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/signup')}
              sx={{ 
                bgcolor: '#1DB954', color: 'black', fontWeight: 'bold', 
                fontSize: '1.2rem', px: 5, py: 2, borderRadius: 50,
                animation: `${pulse} 2s infinite`
              }}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/login')}
              sx={{ 
                borderColor: 'white', color: 'white', fontWeight: 'bold', 
                fontSize: '1.2rem', px: 5, py: 2, borderRadius: 50,
                '&:hover': { borderColor: '#1DB954', color: '#1DB954' }
              }}
            >
              Login
            </Button>
          </Stack>
        </Stack>

        {/* FEATURE CARDS SECTION */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mt: 15 }}>
          
          {/* Card 1: Lyrics */}
          <Paper sx={{ 
            flex: 1, p: 4, bgcolor: '#121212', borderRadius: 8, border: '1px solid #333',
            animation: `${float} 6s ease-in-out infinite`
          }}>
            <Box sx={{ width: 50, height: 50, bgcolor: 'rgba(29,185,84,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Mic sx={{ color: '#1DB954' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Karaoke Mode</Typography>
            <Typography color="gray">
              Lyrics that flow with the beat. Click any line to instantly jump the song to that exact moment.
            </Typography>
          </Paper>

          {/* Card 2: Speed */}
          <Paper sx={{ 
            flex: 1, p: 4, bgcolor: '#121212', borderRadius: 8, border: '1px solid #333',
            animation: `${float} 6s ease-in-out infinite`, animationDelay: '1s'
          }}>
            <Box sx={{ width: 50, height: 50, bgcolor: 'rgba(29,185,84,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Bolt sx={{ color: '#1DB954' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Burst Polling</Typography>
            <Typography color="gray">
              Engineered for speed. Our custom polling engine ensures you never miss a beat or a word.
            </Typography>
          </Paper>

          {/* Card 3: Library */}
          <Paper sx={{ 
            flex: 1, p: 4, bgcolor: '#121212', borderRadius: 8, border: '1px solid #333',
            animation: `${float} 6s ease-in-out infinite`, animationDelay: '2s'
          }}>
            <Box sx={{ width: 50, height: 50, bgcolor: 'rgba(29,185,84,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <LibraryMusic sx={{ color: '#1DB954' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Full Control</Typography>
            <Typography color="gray">
              Access your top tracks, recent history, and personal playlists without opening the Spotify app.
            </Typography>
          </Paper>

        </Stack>

        {/* Footer */}
        <Typography align="center" color="gray" sx={{ mt: 15, opacity: 0.5 }}>
          Built with TypeScript, React, Node.js & Spotify API.
        </Typography>

      </Container>
    </Box>
  );
};

export default LandingPage;