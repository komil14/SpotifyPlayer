import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { darkTheme } from "./theme/AppTheme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/Layout/NavBar";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import PlaylistsPage from "./pages/PlaylistsPage";
//@ts-ignore
import PlaylistDetailsPage from "./pages/PlaylistDetailsPage";
import PlayerPage from "./pages/PlayerPage";
//@ts-ignore
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import DictionaryPage from "./pages/DictionaryPage"; // <--- Import this

// Protected Route Helper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Public Route Helper
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box
            sx={{
              minHeight: "100vh",
              width: "100%",
              background:
                "linear-gradient(135deg, #000000 0%, #0a1f12 50%, #050a06 100%)",
              backgroundSize: "400% 400%",
              animation: "gradient 15s ease infinite",
              "@keyframes gradient": {
                "0%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
                "100%": { backgroundPosition: "0% 50%" },
              },
              pb: 10,
            }}
          >
            <NavBar />

            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playlists"
                element={
                  <ProtectedRoute>
                    <PlaylistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playlist/:id"
                element={
                  <ProtectedRoute>
                    <PlaylistDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/player"
                element={
                  <ProtectedRoute>
                    <PlayerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* NEW ROUTE */}
              <Route
                path="/dictionary"
                element={
                  <ProtectedRoute>
                    <DictionaryPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
