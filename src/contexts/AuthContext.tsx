import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "@/lib/apiClient";
import { tokenStorage } from "@/lib/tokenStorage";

// ── Types ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  permissions: Array<{ id: string; name: string }>;
  [key: string]: unknown;
}

export interface AuthProfile {
  [key: string]: unknown;
}

export interface AuthPreferences {
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  marketingEmailConsent?: boolean;
  termsAccepted: true;
}

// signIn return type — Auth.tsx mein onboarding check ke liye data chahiye
export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  profile: AuthProfile;
  preferences: AuthPreferences;
}

interface AuthCtx {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: AuthProfile | null;
  preferences: AuthPreferences | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSessionData>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
}

// ── Backend response shapes ──────────────────────────────────────────────────
interface AuthSessionResponse {
  data: AuthSessionData;
}

interface MeResponse {
  data: {
    user: AuthUser;
    profile: AuthProfile;
    preferences: AuthPreferences;
  };
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  profile: null,
  preferences: null,
  loading: true,
  signIn: async () => { throw new Error("AuthProvider not mounted"); },
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [preferences, setPreferences] = useState<AuthPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((
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
  }, []);

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
        const res = await apiClient.get<MeResponse>("/api/v1/auth/me");
        setSession({ accessToken, refreshToken });
        setUser(res.data.user);
        setProfile(res.data.profile);
        setPreferences(res.data.preferences);
      } catch {
        tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string): Promise<AuthSessionData> => {
    const res = await apiClient.post<AuthSessionResponse>("/api/v1/auth/login", { email, password });
    applySession(
      { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken },
      res.data.user,
      res.data.profile,
      res.data.preferences,
    );
    return res.data;
  }, [applySession]);

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = useCallback(async (data: RegisterData): Promise<void> => {
    const res = await apiClient.post<AuthSessionResponse>("/api/v1/auth/register", data);
    applySession(
      { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken },
      res.data.user,
      res.data.profile,
      res.data.preferences,
    );
  }, [applySession]);

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // server-side fail ho bhi jaye — client state zaroor clear karo
    } finally {
      tokenStorage.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setPreferences(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, session, profile, preferences, loading, signIn, signUp, signOut }),
    [user, session, profile, preferences, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};