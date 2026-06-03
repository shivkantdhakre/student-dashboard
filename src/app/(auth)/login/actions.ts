'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Helper to resolve absolute callback URL dynamically from headers
async function getCallbackUrl() {
  const headerStore = await headers();
  const host = headerStore.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}/auth/callback`;
}

export interface AuthActionResponse {
  error?: string;
  success?: string;
}

export async function loginWithEmail(prevState: any, formData: FormData): Promise<AuthActionResponse | undefined> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signupWithEmail(prevState: any, formData: FormData): Promise<AuthActionResponse | undefined> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const supabase = await createClient();
  const redirectTo = await getCallbackUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user is already confirmed (e.g. email confirmation disabled on Supabase)
  if (data?.session) {
    redirect('/');
  }

  return { success: 'Check your email for the confirmation link!' };
}

export async function loginWithMagicLink(prevState: any, formData: FormData): Promise<AuthActionResponse> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  const supabase = await createClient();
  const redirectTo = await getCallbackUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Magic link sent! Check your inbox to sign in.' };
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const redirectTo = await getCallbackUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
