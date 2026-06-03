export type LightStatus = 'red' | 'yellow' | 'green';

export type Database = {
  public: {
    Tables: {
      lights: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          status: LightStatus;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          status?: LightStatus;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          status?: LightStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      light_status: LightStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type LightRow = Database['public']['Tables']['lights']['Row'];
