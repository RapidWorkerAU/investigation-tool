const tableRowSchema = {
  type: "array",
  items: { type: "string" },
} as const;

export const generateReportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    readiness: {
      type: "object",
      additionalProperties: false,
      properties: {
        requires_acknowledgement: { type: "boolean" },
        missing_information_detected: {
          type: "array",
          items: { type: "string" },
        },
        disclaimer: { type: ["string", "null"] },
        suggested_next_steps: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "requires_acknowledgement",
        "missing_information_detected",
        "disclaimer",
        "suggested_next_steps",
      ],
    },
    facts_confirmed: {
      type: "array",
      items: { type: "string" },
    },
    facts_uncertain: {
      type: "array",
      items: { type: "string" },
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
    },
    report: {
      type: "object",
      additionalProperties: false,
      properties: {
        front_page: {
          type: "object",
          additionalProperties: false,
          properties: {
            facts_confirmed_heading: { type: "string" },
            facts_uncertain_heading: { type: "string" },
            missing_information_heading: { type: "string" },
          },
          required: [
            "facts_confirmed_heading",
            "facts_uncertain_heading",
            "missing_information_heading",
          ],
        },
        cover_page: {
          type: "object",
          additionalProperties: false,
          properties: {
            incident_name: { type: "string" },
            incident_date: { type: "string" },
            report_generated_date: { type: "string" },
            business_logo_note: { type: "string" },
          },
          required: [
            "incident_name",
            "incident_date",
            "report_generated_date",
            "business_logo_note",
          ],
        },
        contents_page: {
          type: "array",
          items: { type: "string" },
        },
        sections: {
          type: "object",
          additionalProperties: false,
          properties: {
            executive_summary: { type: "string" },
            long_description: { type: "string" },
            response_and_recovery: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["summary", "columns", "rows"],
            },
            people_involved: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                render_mode: { type: "string", enum: ["person_node_visuals"] },
                note: { type: "string" },
              },
              required: ["heading", "render_mode", "note"],
            },
            incident_timeline: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                entries: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["heading", "entries"],
            },
            task_and_conditions: { type: "string" },
            factors_and_system_factors: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            predisposing_factors: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            controls_and_barriers: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["heading", "columns", "rows"],
            },
            incident_outcomes: { type: "string" },
            incident_findings: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
              },
              required: ["summary", "columns", "rows"],
            },
            recommendations: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: tableRowSchema },
                approval_fields: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "columns", "rows", "approval_fields"],
            },
            evidence: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                preview_max_width_percent: { type: "number" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["label", "description"],
                  },
                },
              },
              required: ["heading", "preview_max_width_percent", "items"],
            },
            report_metadata: { type: "string" },
            investigation_sign_off: {
              type: "object",
              additionalProperties: false,
              properties: {
                heading: { type: "string" },
                fields: { type: "array", items: { type: "string" } },
              },
              required: ["heading", "fields"],
            },
          },
          required: [
            "executive_summary",
            "long_description",
            "response_and_recovery",
            "people_involved",
            "incident_timeline",
            "task_and_conditions",
            "factors_and_system_factors",
            "predisposing_factors",
            "controls_and_barriers",
            "incident_outcomes",
            "incident_findings",
            "recommendations",
            "evidence",
            "report_metadata",
            "investigation_sign_off",
          ],
        },
      },
      required: ["front_page", "cover_page", "contents_page", "sections"],
    },
  },
  required: [
    "readiness",
    "facts_confirmed",
    "facts_uncertain",
    "missing_information",
    "report",
  ],
} as const;

