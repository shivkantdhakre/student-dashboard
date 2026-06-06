import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Course, Profile } from '@/types/database.types';

// Cache user's course list
export const getCachedCourses = (userId: string): Promise<Course[]> => {
  return unstable_cache(
    async (): Promise<Course[]> => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch cached courses: ${error.message}`);
      }
      return (data || []) as Course[];
    },
    [`user-courses-${userId}`],
    {
      tags: [`courses-${userId}`],
      revalidate: 3600, // Cache for up to 1 hour, or until tag invalidation
    }
  )();
};

// Cache user's profile info (e.g. credits, subscription tier)
export const getCachedProfile = (userId: string): Promise<Profile | null> => {
  return unstable_cache(
    async (): Promise<Profile | null> => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        throw new Error(`Failed to fetch cached profile: ${error.message}`);
      }
      return data;
    },
    [`user-profile-${userId}`],
    {
      tags: [`profile-${userId}`],
      revalidate: 3600, // Cache for up to 1 hour, or until tag invalidation
    }
  )();
};

