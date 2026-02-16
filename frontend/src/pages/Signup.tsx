import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  MusicNote,
  Email,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.5); }
  70% { box-shadow: 0 0 0 15px rgba(29, 185, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again.",
      );
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "calc(100vh - 80px)",
        overflow: "hidden",
      }}
    >
      {/* Background Gradient Blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "-25%",
          left: "-15%",
          width: "50%",
          height: "55%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.25) 0%, transparent 70%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "45%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.15) 0%, transparent 70%)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      <Container
        maxWidth="xs"
        sx={{
          position: "relative",
          zIndex: 1,
          pt: { xs: 4, md: 8 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 4,
            cursor: "pointer",
            animation: `${float} 4s ease-in-out infinite`,
          }}
        >
          <MusicNote sx={{ color: "#1DB954", fontSize: 36 }} />
          <Typography variant="h5" fontWeight="bold">
            SpotifyPlayer
          </Typography>
        </Box>

        {/* Glassmorphism Card */}
        <Box
          sx={{
            width: "100%",
            p: { xs: 4, sm: 5 },
            borderRadius: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            gutterBottom
            sx={{
              background: "linear-gradient(135deg, #fff 40%, #1DB954 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign up to start your music experience
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, bgcolor: "rgba(211,47,47,0.1)", borderRadius: 3 }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSignup}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="Username"
              name="name"
              variant="outlined"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#535353", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.03)",
                },
              }}
            />
            <TextField
              label="Email address"
              name="email"
              variant="outlined"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#535353", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.03)",
                },
              }}
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              required
              value={formData.password}
              onChange={handleChange}
              helperText="Must be at least 6 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#535353", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: "#535353" }}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.03)",
                },
                "& .MuiFormHelperText-root": {
                  color: "#535353",
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 50,
                fontWeight: 700,
                fontSize: "1rem",
                bgcolor: "#1DB954",
                color: "#000",
                animation: `${pulse} 2.5s infinite`,
                "&:hover": { bgcolor: "#1ed760" },
              }}
            >
              Sign Up
            </Button>
          </Box>

          <Box
            sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Already have an account?
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: 50,
                borderColor: "rgba(255,255,255,0.15)",
                color: "white",
                fontWeight: 600,
                "&:hover": { borderColor: "#1DB954", color: "#1DB954" },
              }}
            >
              Log in instead
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
