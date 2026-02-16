import axios from 'axios';

const API_URL = 'http://127.0.0.1:8888/api/auth';

// Define response type
interface AuthResponse {
  token?: string;
  user?: any;
  message?: string;
}

// Configure Axios to save token to LocalStorage automatically
const register = async (userData: any): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/signup`, userData);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const login = async (userData: any): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/login`, userData);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;
