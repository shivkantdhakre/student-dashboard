export interface Course {
  id: string; // uuid, primary key
  title: string; // text
  progress: number; // integer progress percentage (e.g., 0-100)
  icon_name: string; // text representing Lucide icon name
  created_at: string; // timestamp with time zone (ISO-8601 string)
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
    };
  };
}
