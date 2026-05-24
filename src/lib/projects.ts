// src/lib/projects.ts
// Each project = one Pi deployment.
//
// Supabase table (run in SQL Editor):
//
//   create table public.projects (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id) on delete cascade,
//     name text not null,
//     pi_url text not null default '',
//     created_at timestamptz default now()
//   );
//
//   alter table public.projects enable row level security;
//
//   create policy "Users can read own projects"
//     on public.projects for select using (auth.uid() = user_id);
//   create policy "Users can insert own projects"
//     on public.projects for insert with check (auth.uid() = user_id);
//   create policy "Users can update own projects"
//     on public.projects for update using (auth.uid() = user_id);
//   create policy "Users can delete own projects"
//     on public.projects for delete using (auth.uid() = user_id);

import { createClient } from './supabase';
import type { Project } from './types';

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createProject(name: string, piUrl: string): Promise<Project> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name, pi_url: piUrl })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'pi_url'>>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
