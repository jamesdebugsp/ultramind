import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Lovable Cloud - credenciais do projeto
const SUPABASE_URL = "https://qlelriizivotepmgbtuo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZWxyaWl6aXZvdGVwbWdidHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjQ2MDgsImV4cCI6MjA4MTIwMDYwOH0.2B8MnaXcwFisXopZlGvevGEeqXedqu0VePU_UxhYNmU";

export const isBackendConfigured = true;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

