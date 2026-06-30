import type { ReactNode } from 'react';
import type {
  AuthPreferences,
  AuthProfile,
  AuthSession,
  AuthSessionData,
  AuthUser,
  RegisterData,
} from '@/types/auth.type';
import {
  createContext,

  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { tokenStorage } from '@/lib/tokenStorage';
import { fetchAuthMe, login, logout, register } from '@/services/auth.service';

interface AuthContext_ {
  loading: boolean;
  preferences: AuthPreferences | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<AuthSessionData>;
  signOut: () => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  user: AuthUser | null;
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContext_>({
  loading: true,
  preferences: null,
  profile: null,
  session: null,
  signIn: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signOut: async () => {},
  signUp: async () => {},
  user: null,
});

export const useAuth = () => useContext(AuthContext);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [preferences, setPreferences] = useState<AuthPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(
    (
      tokens: AuthSession,
      userData: AuthUser,
      profileData: AuthProfile,
      prefsData: AuthPreferences,
    ) => {
      tokenStorage.set(tokens.accessToken, tokens.refreshToken);
      setSession(tokens);
      setUser(userData);
      setProfile(profileData);
      setPreferences(prefsData);
    },
    [],
  );

  // App load pe localStorage token se session restore karo
  useEffect(() => {
    const restore = async () => {
      const accessToken = tokenStorage.getAccess();
      const refreshToken = tokenStorage.getRefresh();

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetchAuthMe();
        setSession({ accessToken, refreshToken });
        setUser(response.data.user);
        setProfile(response.data.profile);
        setPreferences(response.data.preferences);
      }
      catch {
        tokenStorage.clear();
      }
      finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthSessionData> => {
      const response = await login({ email, password });
      applySession(
        {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
        response.data.user,
        response.data.profile,
        response.data.preferences,
      );
      return response.data;
    },
    [applySession],
  );

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (data: RegisterData): Promise<void> => {
      const response = await register(data);
      applySession(
        {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
        response.data.user,
        response.data.profile,
        response.data.preferences,
      );
    },
    [applySession],
  );

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await logout();
    }
    catch {
      // server-side fail ho bhi jaye — client state zaroor clear karo
    }
    finally {
      tokenStorage.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setPreferences(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      preferences,
      profile,
      session,
      signIn,
      signOut,
      signUp,
      user,
    }),
    [user, session, profile, preferences, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
