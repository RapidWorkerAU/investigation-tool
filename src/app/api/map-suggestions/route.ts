import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getOpenAIClient, investigationSuggestionsModel } from "@/lib/openai/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createAuthedServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type MapSuggestionRequest = {
  mapId?: string;
  mapSnapshot?: unknown;
};

type SuggestionPriority = "low" | "medium" | "high";

type MapSuggestionResponse = {
  overview: string;
  suggestions: Array<{
    id: string;
    title: string;
    question: string;
    rationale: string;
    priority: SuggestionPriority;
    category:
      | "chronology"
      | "evidence"
      | "people"
      | "factors"
      | "controls"
      | "outcomes"
      | "response"
      | "recommendations"
      | "relationships"
      | "scope"
      | "quality"
      | "other";
  }>;
};

const suggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          question: { type: "string" },
          rationale: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          category: {
            type: "string",
            enum: [
              "chronology",
              "evidence",
              "people",
              "factors",
              "controls",
              "outcomes",
              "response",
              "recommendations",
              "relationships",
              "scope",
              "quality",
              "other",
            ],
          },
        },
        required: ["id", "title", "question", "rationale", "priority", "category"],
      },
    },
  },
  required: ["overview", "suggestions"],
} as const;

function isPlainJsonValue(value: unknown) {
  return value !== undefined && value !== null;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const authUser = await getUserFromAuthHeader(authHeader);
  const body = (await request.json().catch(() => null)) as MapSuggestionRequest | null;

  if (!authUser || !authHeader) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (!body?.mapId || !isPlainJsonValue(body.mapSnapshot)) {
    return NextResponse.json(
      { error: "mapId and mapSnapshot are required and mapSnapshot must be valid JSON." },
      { status: 400 },
    );
  }

  const client = getOpenAIClient();
  const supabase = createAuthedServerClient(authHeader.replace("Bearer ", "").trim());

  try {
    const { data: accessibleMap, error: accessError } = await supabase
      .schema("ms")
      .from("system_maps")
      .select("id")
      .eq("id", body.mapId)
      .maybeSingle();

    if (accessError) throw accessError;
    if (!accessibleMap?.id) {
      return NextResponse.json({ error: "Map not found or access denied." }, { status: 404 });
    }

    const response = await client.responses.create({
      model: investigationSuggestionsModel,
      store: false,
      max_output_tokens: 2200,
      instructions: [
        "You review investigation maps and return only high-value items for a suggestions panel.",
        "Use only the supplied map snapshot.",
        "Do not claim facts that are not present in the snapshot.",
        "Prefer specific, useful items over generic advice.",
        "If the map looks strong, return only a small set of observations or suggestions instead of padding the list.",
        "Each suggestion must be concise, distinct, and directly tied to something visible or missing in the map.",
        "Classify every item using the priority field.",
        "Use priority high only when something is missing or unclear enough to interrupt the incident sequence or stop the user understanding what happened, and it must be fixed.",
        "Use priority medium for a suggestion that would deepen the user's understanding if added or fixed, but the incident can still generally be understood.",
        "Use priority low for an observation that may not need action and simply highlights something useful or notable.",
        "Write in clear, complete sentences using simple words and a reading level close to grade 6.",
        "Make the tone helpful, calm, and respectful, never condescending.",
        "Do not use arrows, shorthand fragments, or specialist wording when simpler wording will do.",
        "Do not use dash characters in visible text. Avoid hyphens, en dashes, and em dashes in title, question, rationale, category, and overview fields.",
        "Assume the reader has no investigation experience and no knowledge of this tool.",
        "Do not rely on tool jargon such as node, relation, chronology, sequence, factor, control, or barrier unless you explain it in plain language.",
        "Each sentence must be understandable on its own, even to a first-time user.",
        "Use actual names from the map snapshot, such as document titles, process names, system names, person names, group names, and relationship labels.",
        "Do not write vague statements like 'this node' or 'the process' when an actual name is available.",
        "Write each title field as a direct summary of the item, using actual names where possible.",
        "Write each question field as the only user-facing subtext. Tell the user what to add, fix, or check and why they need to do it or should consider it.",
        "For observations, use the question field to explain what the item highlights and why it matters without forcing an action.",
        "Do not write vague statements like 'not clear', 'not tied', or 'different place' without explaining what that means for the user.",
        "Prefer being slightly longer if needed to make the advice truly clear and useful.",
        "Treat potential outcomes, possible outcomes, maximum reasonable outcomes, reporting outcomes, and actual outcomes as different concepts unless the map explicitly says they should match.",
        "Do not call it a conflict when one item describes a possible or worst-case outcome and another item describes what actually happened.",
        "Only flag an outcome conflict when two items describe the same kind of outcome for the same event and they cannot both be true.",
        "Set the overview field to an empty string.",
        "Set each rationale field to an empty string.",
        "Keep the question field to about 18 to 42 words.",
        "Keep title fields short, direct, and specific.",
        "Each id must be a short stable snake_case label.",
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  task: "Review this investigation map and produce a concise list of high priority items, suggestions, and observations for the suggestions panel.",
                  output_rules: [
                    "Return 0 to 12 suggestions.",
                    "Focus on missing evidence, weak chronology, unclear roles, unsupported findings, incomplete controls or barriers, weak outcomes, weak response and recovery coverage, missing recommendations, and unclear relationships.",
                    "Use priority high only for items that interrupt the incident sequence or stop the user understanding what happened and absolutely need fixing.",
                    "Use priority medium for suggestions that would deepen understanding if added or fixed, but are not blocking overall understanding.",
                    "Use priority low for observations that may not need action and only highlight something useful.",
                    "Set the overview field to an empty string.",
                    "Avoid duplicate suggestions.",
                    "If something is uncertain, phrase it as a question to investigate.",
                    "Use complete sentences with simple, easy-to-follow wording.",
                    "Write for a general audience at about a 6th grade reading level.",
                    "Do not use arrows or shorthand.",
                    "Do not use dash characters in visible text. Avoid hyphens, en dashes, and em dashes in title, question, rationale, category, and overview fields.",
                    "Do not assume the reader understands investigation terms or this tool's internal labels.",
                    "Avoid unexplained tool terms such as nodes, relations, factors, barriers, or sequence steps.",
                    "Use the actual names of nodes, processes, systems, people, groups, documents, and relationships from the map whenever they are available.",
                    "Make each title field a direct summary of the item, not a generic label.",
                    "Make each question field the one visible subtext section. It must clearly say what to add, fix, or check, name the relevant map items, and explain why it matters.",
                    "For observations, make the question field explain what it highlights and why it matters without inventing unnecessary work.",
                    "Set each rationale field to an empty string.",
                    "Treat possible, potential, maximum reasonable, reporting, and actual outcomes as different categories.",
                    "Do not treat a possible or worst-case outcome as conflicting with an actual outcome unless the map clearly says both describe the same thing.",
                    "Use about 18 to 42 words for each question field.",
                    "If plain language needs more words, choose clarity over brevity.",
                  ],
                  map_snapshot: body.mapSnapshot,
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "map_suggestions",
          schema: suggestionSchema,
          strict: true,
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return NextResponse.json(
        { error: "OpenAI returned an empty suggestions response." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(outputText) as MapSuggestionResponse;
    const snapshotHash = createHash("sha256")
      .update(JSON.stringify(body.mapSnapshot))
      .digest("hex");

    const { error: deactivateError } = await supabase
      .schema("ms")
      .from("map_suggestion_runs")
      .update({ is_current: false })
      .eq("map_id", body.mapId)
      .eq("is_current", true);

    if (deactivateError) throw deactivateError;

    const { data: insertedRun, error: runInsertError } = await supabase
      .schema("ms")
      .from("map_suggestion_runs")
      .insert({
        map_id: body.mapId,
        overview: parsed.overview,
        snapshot_hash: snapshotHash,
        generated_by_user_id: authUser.userId,
        is_current: true,
      })
      .select("id, overview, created_at")
      .single();

    if (runInsertError || !insertedRun?.id) throw runInsertError ?? new Error("Unable to save suggestion run.");

    let savedSuggestions: MapSuggestionResponse["suggestions"] = [];

    if (parsed.suggestions.length > 0) {
      const { data: insertedSuggestions, error: suggestionInsertError } = await supabase
        .schema("ms")
        .from("map_suggestions")
        .insert(
          parsed.suggestions.map((suggestion) => ({
            run_id: insertedRun.id,
            map_id: body.mapId,
            suggestion_key: suggestion.id,
            title: suggestion.title,
            question: suggestion.question,
            rationale: suggestion.rationale,
            priority: suggestion.priority,
            category: suggestion.category,
          })),
        )
        .select("id,title,question,rationale,priority,category");

      if (suggestionInsertError) {
        await supabase.schema("ms").from("map_suggestion_runs").delete().eq("id", insertedRun.id);
        throw suggestionInsertError;
      }

      savedSuggestions = (insertedSuggestions ?? []).map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        question: suggestion.question,
        rationale: suggestion.rationale,
        priority: suggestion.priority as SuggestionPriority,
        category: suggestion.category as MapSuggestionResponse["suggestions"][number]["category"],
      }));
    }

    return NextResponse.json({
      overview: insertedRun.overview,
      suggestions: savedSuggestions,
      generatedAt: insertedRun.created_at,
      responseId: response.id,
      model: response.model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate map suggestions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
