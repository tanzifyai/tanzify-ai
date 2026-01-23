import { useAuth } from '@/contexts/AuthContext';

export function useUser() {
  const { user, isLoading, saveProfile } = useAuth() as any;
  return { user, isLoading, saveProfile };
}
