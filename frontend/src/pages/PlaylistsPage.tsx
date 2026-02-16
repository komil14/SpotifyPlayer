import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, 
  CardMedia, CardActionArea 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getPlaylists } from '../services/spotifyService';
import { useNavigate } from 'react-router-dom';
import MiniPlayer from '../components/Player/MiniPlayer';
import { motion } from 'framer-motion'; // <--- Animation

const PlaylistsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
        getPlaylists(user._id).then((res: any) => setPlaylists(res.data || []));
    }
  }, [user]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 12 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Your Library</Typography>
      
      <Box 
        sx={{ 
          display: 'grid', 
          gap: 3, 
          mt: 4,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)'
          }
        }}
      >
        {playlists.map((playlist, index) => (
          <Card 
            key={playlist.id} 
            component={motion.div} // Animate component
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }} // Stagger effect
            whileHover={{ y: -10 }} // Lift up on hover
            sx={{ borderRadius: 4, bgcolor: '#181818', height: '100%' }}
          >
            <CardActionArea 
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
            >
              <Box sx={{ overflow: 'hidden', width: '100%' }}>
                <CardMedia
                    component="img"
                    image={playlist.images?.[0]?.url || 'https://via.placeholder.com/300'}
                    alt={playlist.name}
                    sx={{ 
                        aspectRatio: '1/1', 
                        objectFit: 'cover',
                        transition: '0.3s',
                        '&:hover': { transform: 'scale(1.1)' } // Zoom image on hover
                    }}
                />
              </Box>
              <CardContent sx={{ width: '100%' }}>
                <Typography gutterBottom variant="h6" noWrap sx={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
                  {playlist.name}
                </Typography>
                <Typography variant="body2" color="gray">
                   {playlist.tracks.total} Tracks
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {user && <MiniPlayer userId={user._id} />}
    </Container>
  );
};

export default PlaylistsPage;