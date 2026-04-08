export type ReportRowItem = string[];

export type ReadinessCheck = {
  requires_acknowledgement: boolean;
  missing_information_detected: string[];
  disclaimer: string | null;
  suggested_next_steps: string[];
};

export type InvestigationReportStatus = "draft" | "reviewed" | "approved";

export type InvestigationSavedReportMeta = {
  id: string;
  status: InvestigationReportStatus;
  generated_at: string;
  updated_at?: string;
  version_number: number;
};

export type InvestigationReportPayload = {
  readiness: ReadinessCheck;
  facts_confirmed: string[];
  facts_uncertain: string[];
  missing_information: string[];
  report: {
    branding?: {
      logo_storage_path?: string;
      section_heading_color?: string;
      table_heading_color?: string;
    };
    section_visibility?: Partial<Record<
      | "executive_summary"
      | "long_description"
      | "response_and_recovery"
      | "task_and_conditions"
      | "incident_outcomes"
      | "people_involved"
      | "incident_timeline"
      | "factors_and_system_factors"
      | "predisposing_factors"
      | "controls_and_barriers"
      | "incident_findings"
      | "recommendations"
      | "preliminary_facts"
      | "evidence"
      | "signatures",
      boolean
    >>;
    front_page: {
      facts_confirmed_heading: string;
      facts_uncertain_heading: string;
      missing_information_heading: string;
    };
    cover_page: {
      incident_name: string;
      incident_date: string;
      report_generated_date: string;
      business_logo_note: string;
    };
    contents_page: string[];
    sections: {
      executive_summary: string;
      long_description: string;
      response_and_recovery: {
        summary: string;
        columns: string[];
        rows: ReportRowItem[];
      };
      people_involved: {
        heading: string;
        render_mode: "person_node_visuals";
        note: string;
      };
      incident_timeline: {
        heading: string;
        entries: string[];
      };
      task_and_conditions: string;
      factors_and_system_factors: {
        heading: string;
        columns: string[];
        rows: ReportRowItem[];
      };
      predisposing_factors: {
        heading: string;
        columns: string[];
        rows: ReportRowItem[];
      };
      controls_and_barriers: {
        heading: string;
        columns: string[];
        rows: ReportRowItem[];
      };
      incident_outcomes: string;
      incident_findings: {
        summary: string;
        columns: string[];
        rows: ReportRowItem[];
      };
      recommendations: {
        summary: string;
        columns: string[];
        rows: ReportRowItem[];
        approval_fields: string[];
        endorsed?: boolean[];
      };
      evidence: {
        heading: string;
        preview_max_width_percent: number;
        items: Array<{
          label: string;
          description: string;
          include_in_report?: boolean;
        }>;
      };
      preliminary_facts?: {
        uncertain_notes?: string[];
        missing_information_notes?: string[];
      };
      report_metadata: string;
      investigation_sign_off: {
        heading: string;
        fields: string[];
        prefills?: string[];
      };
      recommendation_sign_off_prefills?: string[];
    };
  };
};

export type InvestigationSavedReportPayload = InvestigationReportPayload & {
  saved_report: InvestigationSavedReportMeta;
};
