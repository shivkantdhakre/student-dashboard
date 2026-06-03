export interface Course {
  id: string; // uuid, primary key
  title: string; // text
  progress: number; // integer progress percentage (e.g., 0-100)
  icon_name: string; // text representing Lucide icon name
  user_id: string; // uuid referencing auth.users
  created_at: string; // timestamp with time zone (ISO-8601 string)
}

export interface Profile {
  id: string; // uuid, primary key referencing auth.users
  email: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  ai_credits_remaining: number;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Course>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<Profile>;
      };
    };
  };
}
