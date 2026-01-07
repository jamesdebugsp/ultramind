import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/error-handler";

export interface Profile {
  id: string;
  user_id: string;
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const createProfile = async (): Promise<Profile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          owner_name: (user.user_metadata as any)?.name || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err);
      return null;
    }
  };

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        data = await createProfile();
      }

      setProfile((data as Profile) ?? null);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setProfile(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error("Not authenticated") };

    setError(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            email: user.email,
            ...updates,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      // Rebusca para garantir consistência (persistência real)
      await fetchProfile();

      toast({
        title: "Perfil atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      return { data: data as Profile, error: null };
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      toast({
        title: "Erro ao salvar",
        description: getUserFriendlyError(err),
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}

