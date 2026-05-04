import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lpioqlhwgqadkrksztoi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaW9xbGh3Z3FhZGtya3N6dG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NzUxMjYsImV4cCI6MjA5MzQ1MTEyNn0.GuGh7G6eg-aacZP3bkodPdLsUtLk4vsOMNNkBsWg9d8';

export const supabase = createClient(supabaseUrl, supabaseKey);
