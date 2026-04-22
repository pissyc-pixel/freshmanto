import type {
  GameRun,
  ResumeCategory,
  StarterProfile,
  StructuredEndingSummary,
  StructuredMonthlySummary
} from "@/types/game";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RunStatus = "active" | "completed";
export type GameEventLogType = "action" | "event" | "settlement";
export type AiReportType = "monthly_journal" | "ending_report";

export type Database = {
  public: {
    Tables: {
      runs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: RunStatus;
          current_year: number;
          current_month: number;
          profile_json: StarterProfile;
          current_state_json: GameRun;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: RunStatus;
          current_year: number;
          current_month: number;
          profile_json: StarterProfile;
          current_state_json: GameRun;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: RunStatus;
          current_year?: number;
          current_month?: number;
          profile_json?: StarterProfile;
          current_state_json?: GameRun;
        };
        Relationships: [];
      };
      monthly_states: {
        Row: {
          id: string;
          run_id: string;
          year: number;
          month: number;
          snapshot_json: StructuredMonthlySummary;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          year: number;
          month: number;
          snapshot_json: StructuredMonthlySummary;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          year?: number;
          month?: number;
          snapshot_json?: StructuredMonthlySummary;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_states_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
      game_event_logs: {
        Row: {
          id: string;
          run_id: string;
          year: number;
          month: number;
          log_type: GameEventLogType;
          message: string;
          metadata_json: Record<string, Json>;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          year: number;
          month: number;
          log_type: GameEventLogType;
          message: string;
          metadata_json?: Record<string, Json>;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          year?: number;
          month?: number;
          log_type?: GameEventLogType;
          message?: string;
          metadata_json?: Record<string, Json>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_event_logs_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_reports: {
        Row: {
          id: string;
          run_id: string;
          year: number;
          month: number | null;
          report_type: AiReportType;
          input_summary_json: StructuredMonthlySummary | StructuredEndingSummary;
          output_markdown: string;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          year: number;
          month?: number | null;
          report_type: AiReportType;
          input_summary_json: StructuredMonthlySummary | StructuredEndingSummary;
          output_markdown: string;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          year?: number;
          month?: number | null;
          report_type?: AiReportType;
          input_summary_json?: StructuredMonthlySummary | StructuredEndingSummary;
          output_markdown?: string;
          model?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_reports_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
      resume_items: {
        Row: {
          id: string;
          run_id: string;
          year: number;
          month: number;
          category: ResumeCategory;
          title: string;
          summary: string;
          source_item_id: string | null;
          metadata_json: Record<string, Json>;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          year: number;
          month: number;
          category: ResumeCategory;
          title: string;
          summary: string;
          source_item_id?: string | null;
          metadata_json?: Record<string, Json>;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          year?: number;
          month?: number;
          category?: ResumeCategory;
          title?: string;
          summary?: string;
          source_item_id?: string | null;
          metadata_json?: Record<string, Json>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_items_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type RunRecord = Database["public"]["Tables"]["runs"]["Row"];
export type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];
export type RunUpdate = Database["public"]["Tables"]["runs"]["Update"];

export type MonthlyStateRecord = Database["public"]["Tables"]["monthly_states"]["Row"];
export type MonthlyStateInsert = Database["public"]["Tables"]["monthly_states"]["Insert"];
export type MonthlyStateUpdate = Database["public"]["Tables"]["monthly_states"]["Update"];

export type GameEventLogRecord = Database["public"]["Tables"]["game_event_logs"]["Row"];
export type GameEventLogInsert = Database["public"]["Tables"]["game_event_logs"]["Insert"];
export type GameEventLogUpdate = Database["public"]["Tables"]["game_event_logs"]["Update"];

export type AIReportRecord = Database["public"]["Tables"]["ai_reports"]["Row"];
export type AIReportInsert = Database["public"]["Tables"]["ai_reports"]["Insert"];
export type AIReportUpdate = Database["public"]["Tables"]["ai_reports"]["Update"];

export type ResumeItemRecord = Database["public"]["Tables"]["resume_items"]["Row"];
export type ResumeItemInsert = Database["public"]["Tables"]["resume_items"]["Insert"];
export type ResumeItemUpdate = Database["public"]["Tables"]["resume_items"]["Update"];
