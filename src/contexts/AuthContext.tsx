import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { name?: string; phone?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[Auth] Tentando login para:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("[Auth] Erro no login:", error.message);
      } else {
        console.log("[Auth] Login bem-sucedido para:", email);
      }
      return { error: (error as Error | null) ?? null };
    } catch (err: any) {
      console.error("[Auth] Erro de rede no login:", err);
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Falha ao conectar. Verifique sua internet e tente novamente."),
      };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { name?: string; phone?: string }
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    try {
      console.log("[Auth] Tentando signup para:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });
      
      if (error) {
        console.error("[Auth] Erro no signUp:", error.message);
        return { error: error as Error };
      }

      // Check if user was created but needs email confirmation
      if (data?.user && !data?.session) {
        console.warn("[Auth] Usuário criado mas sem sessão - pode precisar confirmar email");
      }
      
      if (data?.user && data?.session) {
        console.log("[Auth] Signup completo com sessão ativa, user_id:", data.user.id);
      }

      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Erro de rede no signUp:", err);
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Falha ao conectar. Tente novamente em instantes."),
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // não quebra o app
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
