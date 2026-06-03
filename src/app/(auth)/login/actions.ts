'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
// Helper to resolve absolute callback URL dynamically from environment variables
async function getCallbackUrl() {
  // Use Vercel's provided URL in prod/preview, fallback to localhost
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? 
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
    'http://localhost:3000';

  // Ensure it includes https:// if running on Vercel
  url = url.startsWith('http') ? url : `https://${url}`;
  
  // Remove trailing slash if present
  url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
  
  return `${url}/auth/callback`;
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
