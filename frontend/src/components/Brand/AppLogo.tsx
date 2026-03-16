import React from "react";
import { Box } from "@mui/material";

interface Props {
  size?: number;
}

const AppLogo: React.FC<Props> = ({ size = 40 }) => {
  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      sx={{
        width: size,
        height: size,
        display: "block",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandLogoFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1ed760" />
          <stop offset="100%" stopColor="#159947" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0b0f0c" />
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="16"
        fill="none"
        stroke="url(#brandLogoFill)"
        strokeWidth="2.5"
      />
      <path
        d="M24 42V22.5c0-1.2.97-2.13 2.16-2.07l14.8.77c1.11.06 1.99.98 1.99 2.09v14.13c0 3.25-2.68 5.58-6.24 5.58-3.37 0-5.71-1.93-5.71-4.58 0-2.73 2.56-4.7 5.94-4.7 1.08 0 1.95.13 2.9.44v-8.52l-12.7-.64V37.2c0 3.27-2.56 5.8-6.03 5.8-3.35 0-5.81-1.98-5.81-4.71 0-2.79 2.56-4.78 5.98-4.78 1.12 0 1.99.16 2.82.47Z"
        fill="url(#brandLogoFill)"
      />
    </Box>
  );
};

export default AppLogo;
