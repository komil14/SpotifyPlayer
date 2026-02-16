import React from 'react';
import { Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import NowPlaying from '../components/Player/NowPlaying'; // Use NowPlaying, not PlayerBar

const PlayerPage: React.FC = () => {
    const { user } = useAuth();
    
    if (!user) return null;

    return (
        <Container maxWidth="lg" sx={{ mt: 8 }}>
            <NowPlaying userId={user._id} />
        </Container>
    );
};

export default PlayerPage;