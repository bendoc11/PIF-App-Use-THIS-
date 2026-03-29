export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coaches: {
        Row: {
          avatar_color: string | null
          avatar_text_color: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          focus_area: string | null
          id: string
          initials: string | null
          name: string
          position: string | null
          school: string | null
          sort_order: number
        }
        Insert: {
          avatar_color?: string | null
          avatar_text_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          initials?: string | null
          name: string
          position?: string | null
          school?: string | null
          sort_order?: number
        }
        Update: {
          avatar_color?: string | null
          avatar_text_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          initials?: string | null
          name?: string
          position?: string | null
          school?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          body: string
          category: string
          created_at: string
          display_avatar_url: string | null
          display_name: string | null
          hidden: boolean
          id: string
          reply_count: number
          title: string
          upvote_count: number
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          display_avatar_url?: string | null
          display_name?: string | null
          hidden?: boolean
          id?: string
          reply_count?: number
          title: string
          upvote_count?: number
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          display_avatar_url?: string | null
          display_name?: string | null
          hidden?: boolean
          id?: string
          reply_count?: number
          title?: string
          upvote_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_replies: {
        Row: {
          body: string
          created_at: string
          display_avatar_url: string | null
          display_name: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_avatar_url?: string | null
          display_name?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_avatar_url?: string | null
          display_name?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_upvotes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          categories: string[] | null
          category: string | null
          coach_id: string | null
          created_at: string
          description: string | null
          drill_count: number
          id: string
          is_featured: boolean
          is_free: boolean
          level: string | null
          skill_levels: string[] | null
          sort_order: number
          status: string
          thumbnail_url: string | null
          title: string
          total_duration_seconds: number
        }
        Insert: {
          categories?: string[] | null
          category?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          drill_count?: number
          id?: string
          is_featured?: boolean
          is_free?: boolean
          level?: string | null
          skill_levels?: string[] | null
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title: string
          total_duration_seconds?: number
        }
        Update: {
          categories?: string[] | null
          category?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          drill_count?: number
          id?: string
          is_featured?: boolean
          is_free?: boolean
          level?: string | null
          skill_levels?: string[] | null
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title?: string
          total_duration_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_shot_results: {
        Row: {
          completed_at: string
          drill_id: string
          id: string
          shooting_percentage: number
          shots_attempted: number
          shots_made: number
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string
          drill_id: string
          id?: string
          shooting_percentage: number
          shots_attempted: number
          shots_made: number
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string
          drill_id?: string
          id?: string
          shooting_percentage?: number
          shots_attempted?: number
          shots_made?: number
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drill_shot_results_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_shot_results_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          category: string
          coach_id: string | null
          coaching_tips: Json | null
          course_id: string | null
          created_at: string
          description: string | null
          drill_type: string | null
          duration_seconds: number | null
          enable_shot_tracking: boolean
          equipment_needed: string[] | null
          id: string
          is_featured: boolean
          is_free: boolean
          is_new: boolean
          level: string | null
          mux_playback_id: string | null
          reps: number | null
          sets: number | null
          shot_attempts: number | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          vimeo_id: string | null
        }
        Insert: {
          category: string
          coach_id?: string | null
          coaching_tips?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          drill_type?: string | null
          duration_seconds?: number | null
          enable_shot_tracking?: boolean
          equipment_needed?: string[] | null
          id?: string
          is_featured?: boolean
          is_free?: boolean
          is_new?: boolean
          level?: string | null
          mux_playback_id?: string | null
          reps?: number | null
          sets?: number | null
          shot_attempts?: number | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          vimeo_id?: string | null
        }
        Update: {
          category?: string
          coach_id?: string | null
          coaching_tips?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          drill_type?: string | null
          duration_seconds?: number | null
          enable_shot_tracking?: boolean
          equipment_needed?: string[] | null
          id?: string
          is_featured?: boolean
          is_free?: boolean
          is_new?: boolean
          level?: string | null
          mux_playback_id?: string | null
          reps?: number | null
          sets?: number | null
          shot_attempts?: number | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          vimeo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drills_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      game_logs: {
        Row: {
          assists: number
          blocks: number
          created_at: string
          efficiency: number | null
          fg_attempted: number
          fg_made: number
          fg_percentage: number | null
          ft_attempted: number
          ft_made: number
          ft_percentage: number | null
          game_date: string
          game_rating: number | null
          game_type: string
          id: string
          minutes_played: number
          opponent: string | null
          points: number
          rebounds: number
          result: string
          steals: number
          three_attempted: number
          three_made: number
          three_percentage: number | null
          turnovers: number
          user_id: string
        }
        Insert: {
          assists?: number
          blocks?: number
          created_at?: string
          efficiency?: number | null
          fg_attempted?: number
          fg_made?: number
          fg_percentage?: number | null
          ft_attempted?: number
          ft_made?: number
          ft_percentage?: number | null
          game_date?: string
          game_rating?: number | null
          game_type?: string
          id?: string
          minutes_played?: number
          opponent?: string | null
          points?: number
          rebounds?: number
          result?: string
          steals?: number
          three_attempted?: number
          three_made?: number
          three_percentage?: number | null
          turnovers?: number
          user_id: string
        }
        Update: {
          assists?: number
          blocks?: number
          created_at?: string
          efficiency?: number | null
          fg_attempted?: number
          fg_made?: number
          fg_percentage?: number | null
          ft_attempted?: number
          ft_made?: number
          ft_percentage?: number | null
          game_date?: string
          game_rating?: number | null
          game_type?: string
          id?: string
          minutes_played?: number
          opponent?: string | null
          points?: number
          rebounds?: number
          result?: string
          steals?: number
          three_attempted?: number
          three_made?: number
          three_percentage?: number | null
          turnovers?: number
          user_id?: string
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          ball_handling: number
          calculated_at: string
          finishing: number
          id: string
          overall: number
          shooting: number
          user_id: string
        }
        Insert: {
          ball_handling?: number
          calculated_at?: string
          finishing?: number
          id?: string
          overall?: number
          shooting?: number
          user_id: string
        }
        Update: {
          ball_handling?: number
          calculated_at?: string
          finishing?: number
          id?: string
          overall?: number
          shooting?: number
          user_id?: string
        }
        Relationships: []
      }
      practice_shot_logs: {
        Row: {
          created_at: string
          ft_attempts: number | null
          ft_makes: number | null
          id: string
          log_date: string
          midrange_attempts: number | null
          midrange_makes: number | null
          off_dribble_attempts: number | null
          off_dribble_makes: number | null
          three_attempts: number | null
          three_makes: number | null
          total_attempts: number | null
          total_makes: number | null
          training_log_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ft_attempts?: number | null
          ft_makes?: number | null
          id?: string
          log_date?: string
          midrange_attempts?: number | null
          midrange_makes?: number | null
          off_dribble_attempts?: number | null
          off_dribble_makes?: number | null
          three_attempts?: number | null
          three_makes?: number | null
          total_attempts?: number | null
          total_makes?: number | null
          training_log_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ft_attempts?: number | null
          ft_makes?: number | null
          id?: string
          log_date?: string
          midrange_attempts?: number | null
          midrange_makes?: number | null
          off_dribble_attempts?: number | null
          off_dribble_makes?: number | null
          three_attempts?: number | null
          three_makes?: number | null
          total_attempts?: number | null
          total_makes?: number | null
          training_log_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_shot_logs_training_log_id_fkey"
            columns: ["training_log_id"]
            isOneToOne: false
            referencedRelation: "training_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          banned: boolean
          created_at: string
          email: string | null
          first_name: string | null
          height: string | null
          id: string
          last_drill_date: string | null
          last_name: string | null
          onboarding_completed: boolean
          phone: string | null
          plan: string
          position: string | null
          primary_goal: string | null
          product_tour_completed: boolean
          role: string
          schedule_setup_completed: boolean
          streak_days: number
          strengths: string[] | null
          stripe_customer_id: string | null
          subscription_checked_at: string | null
          subscription_status: string | null
          total_drills_completed: number
          training_days_per_week: number | null
          training_hours_per_session: string | null
          updated_at: string
          user_type: string | null
          weaknesses: string[] | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          email?: string | null
          first_name?: string | null
          height?: string | null
          id: string
          last_drill_date?: string | null
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          position?: string | null
          primary_goal?: string | null
          product_tour_completed?: boolean
          role?: string
          schedule_setup_completed?: boolean
          streak_days?: number
          strengths?: string[] | null
          stripe_customer_id?: string | null
          subscription_checked_at?: string | null
          subscription_status?: string | null
          total_drills_completed?: number
          training_days_per_week?: number | null
          training_hours_per_session?: string | null
          updated_at?: string
          user_type?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          email?: string | null
          first_name?: string | null
          height?: string | null
          id?: string
          last_drill_date?: string | null
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          position?: string | null
          primary_goal?: string | null
          product_tour_completed?: boolean
          role?: string
          schedule_setup_completed?: boolean
          streak_days?: number
          strengths?: string[] | null
          stripe_customer_id?: string | null
          subscription_checked_at?: string | null
          subscription_status?: string | null
          total_drills_completed?: number
          training_days_per_week?: number | null
          training_hours_per_session?: string | null
          updated_at?: string
          user_type?: string | null
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      saved_drills: {
        Row: {
          created_at: string
          drill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          drill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_drills_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
        ]
      }
      training_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          intensity: string | null
          log_date: string
          notes: string | null
          session_type: string
          status: string
          user_id: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          session_type: string
          status?: string
          user_id: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          session_type?: string
          status?: string
          user_id?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          current_drill_index: number
          drills_completed: number
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          current_drill_index?: number
          drills_completed?: number
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          current_drill_index?: number
          drills_completed?: number
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_drill_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          drill_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          drill_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          drill_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_drill_progress_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_schedule_templates: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          order_index: number
          session_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          order_index?: number
          session_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          order_index?: number
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_drills: {
        Row: {
          created_at: string
          drill_id: string
          id: string
          position: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          drill_id: string
          id?: string
          position?: number
          workout_id: string
        }
        Update: {
          created_at?: string
          drill_id?: string
          id?: string
          position?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_drills_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_drills_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
