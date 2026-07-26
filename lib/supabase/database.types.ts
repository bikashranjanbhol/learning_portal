/**
 * Hand-maintained mirror of supabase/migrations.
 *
 * Regenerate from the live schema once the project is linked:
 *   npm run db:types
 *
 * Until then this file is the contract. If you change a migration, change this
 * too — `tsc --noEmit` is the only thing standing between a schema drift and a
 * runtime error in production.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'monthly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'refunded' | 'pending';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_checkout_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number | null;
          currency: string | null;
          starts_at: string;
          /** NULL means lifetime. */
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: SubscriptionTier;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          starts_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          order_index: number;
          is_premium: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          order_index?: number;
          is_premium?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          course_id: string;
          slug: string;
          title: string;
          description: string | null;
          mdx_path: string;
          order_index: number;
          is_free: boolean;
          reading_time: number | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          slug: string;
          title: string;
          description?: string | null;
          mdx_path: string;
          order_index?: number;
          is_free?: boolean;
          reading_time?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>;
        Relationships: [];
      };
      processed_stripe_events: {
        Row: {
          id: string;
          type: string;
          processed_at: string;
          payload_summary: Json | null;
        };
        Insert: {
          id: string;
          type: string;
          processed_at?: string;
          payload_summary?: Json | null;
        };
        Update: Partial<
          Database['public']['Tables']['processed_stripe_events']['Insert']
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      has_active_access: {
        Args: { check_user_id?: string };
        Returns: boolean;
      };
      access_expires_at: {
        Args: { check_user_id?: string };
        Returns: string | null;
      };
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type UserRow = Tables<'users'>;
export type SubscriptionRow = Tables<'subscriptions'>;
export type CourseRow = Tables<'courses'>;
export type ChapterRow = Tables<'chapters'>;
