import { useAuthContext } from '../context/AuthContext';

// Convenience hook exposing the auth context.
export default function useAuth() {
  return useAuthContext();
}
