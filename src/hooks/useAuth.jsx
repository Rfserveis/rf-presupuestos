// src/hooks/useAuth.jsx
import { useAuth as useAuthFromContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthFromContext();
}

export default useAuth;
