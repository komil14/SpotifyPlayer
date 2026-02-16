import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button } from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', py: 1 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
        >
          <MusicNote sx={{ color: '#1DB954', fontSize: 40 }} />
          <Typography variant="h5" color="text.primary" fontWeight="bold">
            SpotifyPlayer
          </Typography>
        </Box>

        {/* Links */}
        {user ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link to="/dashboard"><Button sx={{ color: 'white' }}>Dashboard</Button></Link>
            <Link to="/player"><Button sx={{ color: 'white' }}>Player</Button></Link>
            <Link to="/playlists"><Button sx={{ color: 'white' }}>Playlists</Button></Link>
            <Link to="/search"><Button sx={{ color: 'white' }}>Search</Button></Link>
            {/* NEW BUTTON */}
            <Link to="/dictionary"><Button sx={{ color: 'white' }}>Dictionary</Button></Link>
            <Link to="/profile"><Button sx={{ color: 'white' }}>Profile</Button></Link>
          </Box>
        ) : (
          <Box />
        )}

        {/* Auth Buttons */}
        {!user && (
            <Box>
            <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text" sx={{ color: 'white', mr: 2 }}>Log In</Button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary">Sign Up</Button>
            </Link>
            </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;