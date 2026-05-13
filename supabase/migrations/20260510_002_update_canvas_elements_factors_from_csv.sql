do $$
declare
  missing_existing_count integer;
  import_rows jsonb := $canvas_element_factors_import$
[
    {
        "id":  "023127b7-b672-47c2-bf46-5a6d93211c41",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "1986 Pipeline Risk Warning Ignored",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental received an internal warning in 1986 about the risk posed by the connected gas pipelines but did not act on it.",
                               "confidence_level":  "medium"
                           },
        "pos_x":  10866,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "0255f67e-4a7d-4646-bf49-2adcc5c1ef50",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Pipeline And Wellhead Shutdown",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Pipeline and wellhead shutdown. Isolation of the subsea pipelines and wellheads feeding Piper Alpha to cut off fuel supply to the fire.",
                               "environmental_context":  "Shutdown was significantly delayed. Connected platforms continued to pump for an extended period after the initial explosion. The absence of clear authority structure for cross-platform emergency shutdown contributed to the delay. Wellheads were ultimately shut in by ROV in the days following."
                           },
        "pos_x":  10112,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "02b03c31-243a-413c-a791-aeea18637331",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift OIM did not communicate the open PSV-504 permit verbally to the incoming night shift",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The outgoing Day Shift OIM did not brief the incoming night shift team on the existence of the open permit to work for PSV-504, leaving the night shift unaware that Pump A was in a dangerous isolated state.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "6fd090b3-9c2a-4ae3-9874-afc8ba3dbf51",
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  1464,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift Maintenance Technician(s) did not close or reinstate the PTW before the end of shift",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The day shift maintenance team did not complete the PSV-504 work within the shift and left the permit to work open in the control room without notifying the incoming team, creating a latent hazard that persisted into the night shift.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  1464,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "05041769-ff1d-4674-b026-0ab743339de4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Survivors Recovered From Sea",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Sea -- around platform base",
                               "timestamp":  "1988-07-06T22:55",
                               "description":  "Survivors who had independently chosen to jump from lower decks and lifeboat stations rather than shelter in the accommodation block are recovered from the sea by rescue craft from Tharos and Silver Pit."
                           },
        "pos_x":  9688,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "0587eaab-3d50-4969-aa19-45a77cb9bcd9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Pre-Start Physical Inspection",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Lead Production Operator / OIM",
                               "description":  "Pre-start physical inspection of equipment - neither the lead production operator nor the OIM physically inspected Pump A or the pipe spool before the start was authorised and executed. The decision was based solely on a paper permit.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  2880,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "065af51f-a009-4a16-9303-e74d2b4cf82d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "MV Tharos Firefighting Attempt",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "emergency_response",
                               "description":  "MV Tharos moved alongside the platform and deployed its water monitor cannons in an attempt to suppress the fire at the module and riser areas. The vessel was forced to withdraw due to heat intensity and falling debris before the second explosion."
                           },
        "pos_x":  792,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "07030c81-aeb1-4aab-b0c8-afd80f322ecf",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "MV Tharos Crew were on station and responded to the emergency immediately",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Tharos was on standby station at the time of the initial explosion and moved toward the platform immediately, deploying water monitor cannons in an attempt to suppress the fire before being forced to withdraw.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "f4b57273-45c1-4491-904d-e7b313cdcbe2",
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390",
                                                       "3575f6c3-16b4-45b3-826a-588e9c3bd9d1"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  13038,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "MV Silver Pit Crew were on station and immediately launched rescue craft to recover survivors",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Silver Pit crew observed the first explosion from their standby position and immediately moved toward the platform, launching fast rescue craft that recovered the majority of the 61 survivors from the sea.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  13038,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Barry Barber and Ian Fowler entered the water to assist survivors and both died in the attempt",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The two Silver Pit divers voluntarily entered the water alongside the burning platform to assist survivors who could not reach the rescue craft unaided. Both men died during the rescue attempt, the only rescuer fatalities of the incident.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "3575f6c3-16b4-45b3-826a-588e9c3bd9d1"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  13038,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  "0967f1a2-04f4-47bd-9dd2-1cd4f2234aca",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "PSV-504 Permit Left Open At Handover",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The permit to work for PSV-504 was left open at shift handover without verbal communication to the incoming night shift.",
                               "confidence_level":  "high"
                           },
        "pos_x":  744,
        "pos_y":  1848,
        "width":  216,
        "height":  144
    },
    {
        "id":  "0a028ba4-8088-4c42-b337-47e48cd0b033",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No industry-wide standard existed requiring joint emergency plans for interconnected offshore platforms",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No regulatory or industry requirement existed for operators of interconnected offshore installations to maintain joint emergency response plans or cross-platform shutdown protocols, leaving a critical gap when Piper Alpha required coordinated action from Tartan and Claymore.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  13038,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "0b11e8ad-a4e8-4f48-8326-bb6e7e6f536b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The accommodation block was not designed to withstand blast and thermal loads from a major riser fire",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The accommodation block was structurally inadequate to protect personnel against the blast and thermal loading of a major gas riser explosion. It was structurally compromised by the second explosion and collapsed into the sea with 87 men inside.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  7998,
        "pos_y":  64,
        "width":  168,
        "height":  96
    },
    {
        "id":  "0ff65bad-609f-4b57-bf05-c7b32826c15c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Tartan And Claymore Ordered To Shut Down",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Tartan \u0026 Claymore platforms / subsea wellheads",
                               "timestamp":  "1988-07-07T03:45",
                               "description":  "Occidental Petroleum orders Tartan and Claymore to shut down their export pipelines feeding into the Piper Alpha system. Subse wellheads on Piper Alpha are subsequently shut in by remotely operated vehicles."
                           },
        "pos_x":  12280,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "1029aca5-b7f9-4de2-ae65-622e6282cf90",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No procedure required the deluge system to be returned to automatic mode after diving operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No documented procedure existed requiring the firewater deluge system to be returned to automatic mode when diving operations concluded, nor for its manual status to be formally flagged at shift handover. This allowed the system to remain in manual mode without challenge throughout the emergency.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  5040,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "118c688b-56e0-4024-ab56-905231acd320",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Immersion suits were not accessible to workers trapped in the accommodation block",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Personal survival suits and immersion suits were not readily accessible to personnel inside the accommodation block before conditions became unsurvivable. Workers who did escape into the water did so without thermal protection, relying on the speed of rescue craft to survive the North Sea.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  7362,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "11b3063e-a620-45b5-a1d9-da3100ff725c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Victim Recovery And Identification",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "medical_treatment",
                               "description":  "Bodies of the deceased were recovered from the sea and from the wreckage during and after the rescue operations. 30 bodies were never recovered. The recovered remains were transported to shore for formal identification by Grampian Police."
                           },
        "pos_x":  7200,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "12738e07-426f-4628-9eae-890918a89f9e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) did not issue a shutdown instruction to Tartan or Claymore after the initial explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s onshore management held the authority to instruct connected platforms to shut down their export pipelines but did not issue that instruction during the critical window after the initial explosion, allowing both platforms to continue pumping and sustaining the riser fires.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  9270,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "13e3cade-0b73-44df-96eb-27b207711de8",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "External Emergency Dispatch Logs",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "RAF / HM Coastguard operational dispatch logs",
                               "media_mime":  "",
                               "media_name":  "",
                               "description":  "RAF Lossiemouth and Coastguard Aberdeen received the first external emergency notification at approximately 22:05 and dispatched search and rescue assets. Operational logs establish the external response timeline and confirm the sequence of rescue asset deployment through the night of 6 to 7 July.",
                               "evidence_type":  "record",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "",
                               "show_canvas_preview":  false
                           },
        "pos_x":  10326,
        "pos_y":  1624,
        "width":  216,
        "height":  144
    },
    {
        "id":  "1730250d-9b9c-4f0e-9217-585ef2274a4e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) did not foster a culture where workers could raise safety concerns without fear",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety culture did not create an environment where workers felt able to challenge decisions by the OIM or raise concerns about procedural shortcuts without fear of professional consequences, normalising the kind of shortcuts that contributed directly to the incident.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  2880,
        "pos_y":  -360,
        "width":  168,
        "height":  96
    },
    {
        "id":  "18092314-b1be-442e-adae-5cdf0e5ccb14",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Transfer Safety Regulation To HSE",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "1991-01-01",
                               "owner_text":  "UK Government — Secretary of State for Energy",
                               "action_type":  "corrective",
                               "description":  "Transfer responsibility for offshore safety regulation from the Department of Energy to the Health and Safety Executive, removing the conflict of interest between production promotion and safety enforcement."
                           },
        "pos_x":  0,
        "pos_y":  2112,
        "width":  216,
        "height":  144
    },
    {
        "id":  "1a15cfcb-eb9e-45be-9a5d-6bf4270d6eb7",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Firewall And Blast Panels",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Design / Engineering",
                               "description":  "Firewall and blast panels between process modules - designed to contain fire within a single module but not rated for a vapour cloud explosion of the magnitude that occurred. Failed on the first blast, allowing fire to spread immediately into adjacent modules and disabling other safety systems.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed",
                               "body_display_mode":  "description"
                           },
        "pos_x":  6480,
        "pos_y":  1200,
        "width":  216,
        "height":  144
    },
    {
        "id":  "1cf3ba52-8327-42f6-a0eb-fb10458533aa",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) added gas compression and condensate injection in 1978 without redesigning safety systems to match the increased hazard profile",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "When gas compression and condensate injection were added to Piper Alpha in 1978, Occidental\u0027s management did not commission a commensurate redesign of safety systems, escape routes, or firewall ratings. The platform was operated with a significantly higher hazard profile than its original design accounted for.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  10446,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "1da70830-fff3-4cc3-ba94-7357d154853a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The permit to work system did not require physical tags or locks on isolated equipment to communicate hazard state",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The PTW system relied solely on paper records held in the control room to communicate the isolation state of safety-critical equipment. No physical tags, locks, or visual indicators were required at the equipment itself, meaning a person could approach and start isolated equipment without any on-site warning.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  0,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "1db1a956-70e2-4a92-b68e-c55202e8cf1d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Require Offshore Safety Cases",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "1992-01-01",
                               "owner_text":  "HSE — Offshore Safety Division",
                               "action_type":  "preventive",
                               "description":  "Introduce regulations requiring every operator of a fixed or mobile offshore installation in UK waters to submit a safety case to the HSE for acceptance, demonstrating that major hazards have been identified, evaluated, and reduced to ALARP."
                           },
        "pos_x":  744,
        "pos_y":  2112,
        "width":  216,
        "height":  144
    },
    {
        "id":  "1ec6c8e3-9114-4b87-b5cf-9e40e2175197",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Regulatory oversight of offshore safety sat within a department also mandated to maximise oil production",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Department of Energy held responsibility for both offshore safety regulation and the promotion of oil production, creating a structural conflict of interest that weakened safety enforcement across the UK offshore industry.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [

                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  13038,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  "1ed21cb1-05d7-4bb2-a426-4da01cf93e58",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Planned PSV-504 Maintenance",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "normal",
                               "description":  "Planned maintenance execution. Removal of safety relief valve PSV-504 from Condensate Pump A for routine inspection and maintenance.",
                               "environmental_context":  "Routine scheduled activity conducted during day shift under normal operating conditions. Work order and permit to work system in place."
                           },
        "pos_x":  0,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "1f9f9427-f0d7-4782-af27-9d8da81ed680",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Silver Pit Divers Enter Water",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "emergency_response",
                               "description":  "Two divers from Silver Pit, Barry Barber and Ian Fowler, voluntarily entered the water alongside the burning platform to assist survivors who were unable to reach the rescue craft unaided. Both men died during the rescue attempt."
                           },
        "pos_x":  1680,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "21f9b6d9-10d0-4a69-86a4-f0627ce6d1f3",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Production Team Shift Handover",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Lead Production Operator (outgoing)",
                               "description":  "Production team shift handover briefing - the outgoing day shift production operators did not brief the incoming night shift team on the isolated status of Pump A or the existence of the open permit.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  2160,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "25ba9c42-f35e-46b1-940f-86292e134691",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "No Abandon Platform Order Issued",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No abandon platform order was issued by the OIM at any point during the emergency.",
                               "confidence_level":  "high"
                           },
        "pos_x":  5040,
        "pos_y":  1968,
        "width":  216,
        "height":  144
    },
    {
        "id":  "28405875-8e27-49a1-9ed8-91570e24f01a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Shift Handover Briefing",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Shift handover briefing. Structured verbal and written transfer of operational status, outstanding work, and active hazards between outgoing and incoming shift teams.",
                               "environmental_context":  "No formal briefing was conducted regarding the open PSV-504 permit. Handover culture on Piper Alpha did not enforce verbal communication of outstanding permits, creating an information gap at shift change."
                           },
        "pos_x":  1464,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2860a42a-3c9b-4cee-b93a-92d388f2c184",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No written handover log or formal checklist was required to be completed at OIM shift change",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No formal requirement existed for the outgoing OIM to complete and sign a written handover log covering outstanding permits, equipment states, and operational hazards. The adequacy of shift handover was left to individual practice, with no mechanism to ensure critical information was transferred.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  1464,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "2bfb5139-0e10-4cfd-a491-2adf30d8a694",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No cross-platform emergency shutdown protocol existed to isolate connected export pipelines in a major incident",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No documented protocol existed that would automatically or mandatorily require the isolation of connected export pipelines from neighbouring platforms in the event of a major incident on Piper Alpha. This absence directly allowed Tartan and Claymore to continue pumping for nearly an hour after the first explosion.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  9270,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "2c6638c7-950a-4ea4-95b3-c5c12bf1f8d4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "MV Silver Pit Crew Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Witness testimony — MV Silver Pit crew, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The crew of MV Silver Pit gave evidence to the Cullen Inquiry detailing the rescue of survivors from the sea and the deaths of two divers who could not be recovered in time. Their account confirms that all survivors removed were those who had independently evacuated by jumping from the platform.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363752291-54638435-5a28-4710-8f53-fa99a7c8b224-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  9150,
        "pos_y":  1624,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2c755f40-adf4-41cf-a734-93b545a75f8f",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Red Adair Extinguishes Surface Fires",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "make_area_safe",
                               "description":  "Firefighting and well control specialist Red Adair and his team were contracted to extinguish the remaining surface fires burning above the collapsed platform structure. The fires were fully extinguished over three weeks after the initial disaster."
                           },
        "pos_x":  5088,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2d0ba6d2-12d4-4886-9599-4edaa4657f3c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Subsea Wellheads Shut In By ROV",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "make_area_safe",
                               "description":  "Piper Alpha\u0027s subsea wellheads were shut in by remotely operated vehicles in the days following the disaster, isolating the reservoir from the surface fires and ending all hydrocarbon flow from the field."
                           },
        "pos_x":  4560,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2d76db89-09d0-4842-888a-f096eb00129d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Colin Seaton\nOffshore Installation Manager (OIM) -- night shift",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responsible Leader"
                           },
        "pos_x":  72,
        "pos_y":  744,
        "width":  96,
        "height":  144
    },
    {
        "id":  "2d941b52-7bdc-4e54-b103-bfce23fb3d71",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Permit To Work System",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Maintenance Supervisor / OIM",
                               "description":  "Permit to work system - Occidental operated a formal PTW system on Piper Alpha. A permit was raised for the PSV-504 removal and left open in the control room. The system existed but was not followed correctly at handover or when the pump start was being considered.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  0,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2ddb0fff-965b-40f0-94ae-08548073d66b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Abandon Platform Order",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "OIM",
                               "description":  "Abandon platform order - the OIM held authority to issue a platform-wide abandon order. No such order was issued at any point during the emergency, leaving personnel in the accommodation block awaiting instructions that never came.",
                               "barrier_role":  "mitigative",
                               "control_type":  "administrative",
                               "barrier_state":  "failed",
                               "body_display_mode":  "description"
                           },
        "pos_x":  7242,
        "pos_y":  1448,
        "width":  216,
        "height":  144
    },
    {
        "id":  "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "OIM -- Claymore Platform\nOffshore Installation Manager, Claymore (continued pumping, no shutdown order received)",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Involved - Indirect"
                           },
        "pos_x":  5112,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "2e8b60f5-870b-4ed4-9259-074943b1f9c4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Onshore Emergency Shutdown Authority",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Occidental Senior Management (Onshore)",
                               "description":  "Onshore emergency shutdown authority and action - Occidental\u0027s onshore management had authority to instruct connected platforms to shut down but did not issue that instruction during the critical period after the initial explosion.",
                               "barrier_role":  "mitigative",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  9150,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "30bc0683-49e4-46d5-8edf-2501a08469ee",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Lead Production Operator (night shift)\nSenior production operator who authorised Pump A start (name not publicly recorded)",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Involved - Direct"
                           },
        "pos_x":  1512,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "324404a5-a834-4ab4-94d2-194cf485099b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Neighbouring Platform Shutdown Decision",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Neighbouring platform shutdown decision. Decision by the OIMs of Tartan and Claymore platforms on whether to shut down their export pipelines into Piper Alpha.",
                               "environmental_context":  "No shutdown instruction was received from Piper Alpha or from Occidental onshore management. OIMs of connected platforms were uncertain of their authority to shut down independently. Pipelines remained live, feeding fuel to the escalating fire."
                           },
        "pos_x":  7664,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "3378d4bb-8ca4-40cf-af36-5a0f07e2fb8d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_outcome",
        "heading":  "Piper Alpha Destroyed With 167 Fatalities",
        "color_hex":  "#EF4444",
        "created_by_user_id":  "420266a0-2087-4f36-8c28-340443dd1a82",
        "element_config":  {
                               "likelihood":  "likely",
                               "risk_level":  "extreme",
                               "consequence":  "severe",
                               "description":  "Complete destruction of Piper Alpha with 167 fatalities and 61 survivors, representing the deadliest offshore oil disaster in history.",
                               "consequence_category":  "actual"
                           },
        "pos_x":  12068,
        "pos_y":  -872,
        "width":  216,
        "height":  216
    },
    {
        "id":  "338adff4-283f-48ae-85c9-edbad3060e10",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Physical Lockout/Tagout",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Maintenance Department",
                               "description":  "Physical lockout/tagout on isolated equipment - no physical lock or tag was applied to Pump A at the equipment itself. The only record of its isolation state was the paper permit in the control room.",
                               "barrier_role":  "preventive",
                               "control_type":  "engineering",
                               "barrier_state":  "missing"
                           },
        "pos_x":  744,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "354ecff9-443c-4d83-ae84-5835a755fa2c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Harmonise Permit To Work Systems",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Industry — offshore operators collectively",
                               "action_type":  "corrective",
                               "description":  "The industry should work toward harmonisation of permit to work systems, including standardised colour coding for permit types and standardisation of the period for which a permit remains valid."
                           },
        "pos_x":  2880,
        "pos_y":  2160,
        "width":  216,
        "height":  144
    },
    {
        "id":  "35688b83-c6bc-462d-90f0-91e295c93b0a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Public Address System",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Operations",
                               "description":  "Public address and emergency announcement system - damaged and rendered partially non-functional by the first explosion, preventing effective platform-wide emergency communication at the moment it was most needed.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed"
                           },
        "pos_x":  5040,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "3575f6c3-16b4-45b3-826a-588e9c3bd9d1",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Barry Barber \u0026 Ian Fowler\nDivers from Silver Pit who entered the water to rescue survivors -- both died",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Injured Person"
                           },
        "pos_x":  7242,
        "pos_y":  712,
        "width":  240,
        "height":  120
    },
    {
        "id":  "35ad838b-2372-424b-87f8-881eff60800a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) did not issue an abandon platform order at any point during the emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Colin Seaton, the Night Shift OIM, did not issue a platform-wide abandon order at any point during the emergency. Personnel mustered in the accommodation block as directed by standing procedures and received no instruction to self-evacuate. This is a direct essential factor in the death of the majority of those who perished.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  6480,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "390d542f-a214-4e64-afce-bb79266bca5d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Equip Temporary Refuge For Emergency Control",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / platform designers",
                               "action_type":  "corrective",
                               "description":  "The temporary safe refuge must be equipped with facilities for monitoring and control of an emergency, including emergency communications, power, lighting, and smoke and gas detection so that command and control is not lost in the event of damage to the main control room.",
                               "body_display_mode":  "description"
                           },
        "pos_x":  3600,
        "pos_y":  2448,
        "width":  216,
        "height":  144
    },
    {
        "id":  "39a0223c-3872-43a0-8f89-4352d20980de",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "PSV-504 Permit To Work Record",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Permit to work — Occidental Petroleum maintenance system",
                               "media_mime":  "",
                               "media_name":  "",
                               "description":  "The permit to work for the PSV-504 overhaul was filled in by the day shift engineer, noting that Pump A was not ready and must not be switched on. It was left open and stored in the control room at shift handover without verbal communication to the night shift.",
                               "evidence_type":  "record",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "",
                               "show_canvas_preview":  false
                           },
        "pos_x":  0,
        "pos_y":  1608,
        "width":  216,
        "height":  144
    },
    {
        "id":  "3b5226b6-fa4f-4a70-8a47-e9d6b89805be",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Pump A Started And Condensate Released",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Module C -- condensate injection area",
                               "timestamp":  "1988-07-06T21:58",
                               "description":  "Condensate Pump A is started. High-pressure condensate escapes immediately through the open pipe spool where PSV-504 has been removed. The released condensate rapidly vaporises on the module deck, forming a flammable vapour cloud."
                           },
        "pos_x":  3600,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "3d092203-d0f3-4348-b32a-ef06d7ca4fb6",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Adopt Goal-Setting Regulation",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "1992-01-01",
                               "owner_text":  "HSE / UK Government",
                               "action_type":  "preventive",
                               "description":  "The regulatory regime must shift from a periodic compliance to goal-setting framework requiring operators to demonstrate how safety is to be achieved rather than merely confirming adherence to fixed rules."
                           },
        "pos_x":  9150,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "3ddc1fe8-16b6-4493-ac09-5bd0ed6c5429",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Riser Emergency Isolation Valves",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Engineering / Pipeline Operators",
                               "description":  "Riser emergency isolation valves - no remotely or automatically actuated isolation valves existed on the Tartan or Claymore risers at Piper Alpha that could have cut off flow under fire conditions or by remote command.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "missing"
                           },
        "pos_x":  8610,
        "pos_y":  1448,
        "width":  216,
        "height":  144
    },
    {
        "id":  "3de80fbe-8c60-4fbf-90fc-81c74532a5c0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Condensate Pump A Start Authorisation",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Authorisation of equipment start. OIM providing verbal approval to start Condensate Pump A based on information presented by the lead production operator.",
                               "environmental_context":  "The OIM relied solely on the operator\u0027s interpretation of the permit without independently verifying the physical state of the pump. Production continuity pressures were present and there was no requirement to physically inspect before authorising."
                           },
        "pos_x":  3600,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "3f43f6a5-019c-449b-abc6-321d6608f1bd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "OIM Permit Authorisation Process",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "OIM",
                               "description":  "OIM authorisation process for equipment under active permit - no requirement existed for the OIM to verify with maintenance personnel the physical meaning of an open permit before acting on it. The OIM authorised the start on the operator\u0027s verbal interpretation alone.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "missing"
                           },
        "pos_x":  3600,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "42759c4c-6cce-42bd-af6a-a9fdc345db0d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Accommodation Block Recovered",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "scene_preservation",
                               "description":  "The accommodation block was recovered from the seabed in late 1988 by salvage teams and transported to the terminal at Flotta, Orkney. It was systematically searched by a team of Grampian Police officers, divers, and HSE personnel, recovering the bodies of 87 men found inside."
                           },
        "pos_x":  7824,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "43dde0a5-f28f-4238-8ed5-6108188c8fb4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Pump A Started Without PSV-504",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Condensate Pump A was started while PSV-504 was absent and the pipe spool was fitted with an unrated blind flange, causing the initial condensate release.",
                               "confidence_level":  "high"
                           },
        "pos_x":  0,
        "pos_y":  1848,
        "width":  216,
        "height":  144
    },
    {
        "id":  "44820e39-3bce-4baa-b6d0-b63bd73221cd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Day Shift Maintenance Technician(s)\nTechnicians who removed PSV-504 and raised the permit to work",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Involved - Direct"
                           },
        "pos_x":  2232,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "46535186-0954-4041-8aed-e733de44b144",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The Tartan gas riser was subjected to sustained uncontrolled jet fire without suppression until catastrophic failure",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "With the deluge system inactive and no pipeline shutdown instruction issued, the Tartan gas riser was exposed to a sustained, uncontrolled jet fire with no suppression. The riser heated progressively until it failed catastrophically at approximately 22:50, releasing gas at an estimated 15–30 tonnes per second and causing the second, mass-casualty explosion.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  9270,
        "pos_y":  64,
        "width":  168,
        "height":  96
    },
    {
        "id":  "480ce8ef-6730-456f-8e70-7c4ad9599355",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) operated a safety culture that prioritised production continuity over systematic safety assurance",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s organisational safety culture placed production continuity above systematic safety management, creating an environment in which procedural shortcuts were normalised and not challenged. This predisposing condition influenced decisions and behaviours throughout the incident sequence.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  12498,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "48834197-f4fc-4e8d-ad4b-7d3b743f1bd3",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Emergency Muster Procedure",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "OIM / Platform Management",
                               "description":  "Platform emergency response and muster procedure - an emergency plan existed and was followed. It directed all personnel to muster in the accommodation block, a protocol designed for contained fires. It was wholly inadequate for a catastrophic multi-explosion emergency and contributed directly to casualties.",
                               "barrier_role":  "mitigative",
                               "control_type":  "administrative",
                               "barrier_state":  "failed",
                               "body_display_mode":  "description"
                           },
        "pos_x":  7242,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "49083c9b-a86e-4cec-aee1-4708df722ef8",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Night Shift Production Operator Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — night shift production operator, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "Condensate Pump B tripped at approximately 21:45 and led to its restart. The night shift lead production operator stated that the permit for Pump A in the control room, located there at handover, was found and interpreted as sufficient temporary authority to restart Pump A.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363608562-7d229f39-e4d0-4d45-a3e9-cc69b4d0dcd9-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  2160,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "4b50be47-1b06-4f5d-bd6d-2f6885945655",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "OIM — Tartan Platform continued pumping live hydrocarbons through the connected pipeline after the initial explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM of the Tartan Platform continued pumping live hydrocarbons through the pipeline connected to Piper Alpha after the initial explosion, having received no shutdown instruction and having no protocol that empowered independent action. This directly sustained the riser fire that caused the second explosion.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "bb5c063e-9ead-4e81-9bc8-bd4c89cd2ffc",
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  9270,
        "pos_y":  272,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "OIM — Claymore Platform continued pumping live hydrocarbons through the connected pipeline after the initial explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM of the Claymore Platform continued pumping live hydrocarbons through the pipeline connected to Piper Alpha after the initial explosion, having received no shutdown instruction and feeling they lacked authority to act unilaterally. This sustained the riser fires and contributed to the third explosion.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  9270,
        "pos_y":  272,
        "width":  168,
        "height":  96
    },
    {
        "id":  "4b70df3a-aa49-4fe0-81ba-860e634f559e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lead Production Operator (night shift) misidentified the blind flange as a sufficient pressure seal and proceeded to seek authorisation to start Pump A",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Lead Production Operator (night shift) located the open PTW for Pump A in the control room but misinterpreted the temporary blind flange as a rated pressure cap sufficient to allow a brief start-up. This critical misunderstanding was not challenged and led directly to the authorisation and start of Pump A.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "30bc0683-49e4-46d5-8edf-2501a08469ee"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  2880,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "4c8a2085-4932-4b74-90c9-d261cc61d148",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Platform Workforce (general)\n167 workers on board at the time of the incident",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Injured Person"
                           },
        "pos_x":  2952,
        "pos_y":  744,
        "width":  96,
        "height":  144
    },
    {
        "id":  "4cd68022-c269-4c7a-9f22-02462fdc2c91",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Tartan Riser Failure Caused Mass Casualties",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Tartan gas riser failed under sustained jet fire, producing the second explosion which was the primary cause of mass casualties.",
                               "confidence_level":  "high"
                           },
        "pos_x":  7878,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "4cfcba59-d14e-467f-ac20-d6a9b923f42c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Firewall panels between process modules were not rated to withstand a vapour cloud explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The firewall panels separating Module C from adjacent process modules were not designed to withstand a vapour cloud explosion of the magnitude that occurred. They failed on the first blast, allowing fire to spread immediately into adjacent modules and disabling portions of the deluge system.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  5040,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "4d06e5f6-fdba-4360-8d1b-bca798a5a85e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Platform Workforce (general) had not been trained that self-evacuation by jumping into the sea was a legitimate escape option in a catastrophic emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Platform workers had not received any training or briefing indicating that jumping from the platform into the sea was a legitimate or preferred last-resort option in a catastrophic emergency. When the accommodation block became untenable, those who had not self-evacuated had no framework for making that decision.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "4c8a2085-4932-4b74-90c9-d261cc61d148",
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  6480,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) did not provide training to workers on sea self-evacuation as a recognised emergency option",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s emergency training and procedures did not include self-evacuation to the sea as a recognised last-resort option, leaving workers without a decision framework when the accommodation block became untenable during the catastrophic emergency.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  6480,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "4f2227a3-53e8-432d-ba73-03bfbce3efb5",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Sea conditions were calm on the night of 6 July 1988, which aided survivor recovery from the water",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The relatively calm sea conditions in the North Sea on the night of 6 July 1988 were a neutral environmental factor that aided the recovery of survivors from the water by rescue craft from Silver Pit and Tharos.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "neutral"
                           },
        "pos_x":  13038,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "4f4bae92-2e60-45db-9768-f4160636328e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Personnel Mustered Without Evacuation Instruction",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Personnel mustered in the accommodation block as per standing procedure and received no instruction to self-evacuate to the sea.",
                               "confidence_level":  "high"
                           },
        "pos_x":  5784,
        "pos_y":  2208,
        "width":  216,
        "height":  144
    },
    {
        "id":  "4fab3413-f962-4d5e-a4ce-c13560ba06ce",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Establish Offshore Safety Division",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "1991-01-01",
                               "owner_text":  "HSE — Chief Executive",
                               "action_type":  "corrective",
                               "description":  "A specialist Offshore Safety Division must be established within the HSE with dedicated expertise to discharge the regulatory function for offshore oil and gas installations."
                           },
        "pos_x":  9786,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "548f49f2-6384-4dcd-b915-1615d7978174",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Platform Structure Collapses Into Sea",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Platform-wide structural collapse",
                               "timestamp":  "1988-07-06T23:30",
                               "description":  "The platform\u0027s main structural sections begin progressively collapsing into the sea. The derrick, main deck, sections, and accommodation block fall into the water. Fires continue burning above the waterline."
                           },
        "pos_x":  10768,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "57d32214-8ae5-47a0-837d-b0a385d85d27",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "PTW Closure Before Handover",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Maintenance Supervisor / OIM",
                               "description":  "Permit to work closure before handover - no requirement existed or was followed to formally close and reinstate safety-critical equipment before handing over to the next shift if work was incomplete.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "missing"
                           },
        "pos_x":  744,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "5858b289-d372-4f53-ab40-d7dd2b3b9063",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "UK Coast Guard \u0026 RAF rescue crews\nHelicopter search and rescue teams deployed overnight",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responder"
                           },
        "pos_x":  7878,
        "pos_y":  712,
        "width":  240,
        "height":  120
    },
    {
        "id":  "5877cb14-7964-4c40-8b93-cca86d99e1b4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) subjected contractor workforce to the same inadequate safety management systems as direct employees with no additional oversight",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system applied equally to contractors and direct employees without additional oversight, verification, or assurance that contractors were integrated into emergency procedures. This meant the systemic safety failures were not mitigated by any additional contractor-specific controls.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  11766,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  "58974f4c-d154-40dc-ab9b-d8210cfee75f",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) lost situational awareness of the platform\u0027s condition shortly after the first explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Colin Seaton lost effective situational awareness of the developing emergency shortly after the first explosion due to loss of communications, smoke, and structural damage. His ability to exercise command and make informed decisions about evacuation was effectively lost before the most critical decisions were required.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  6480,
        "pos_y":  -336,
        "width":  168,
        "height":  96
    },
    {
        "id":  "5907b9ac-e75f-47c2-b642-df0feb013e45",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Coast Guard And RAF Survivor Search",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "emergency_response",
                               "description":  "Coast Guard and RAF search and rescue helicopters conducted survivor searches around the platform and wreckage site through the night of 6 to 7 July, working alongside the support vessel rescue craft to recover all 61 survivors from the water."
                           },
        "pos_x":  3048,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "59956177-a9db-406c-ba93-a0195d79b9d9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "61 Survivors self-evacuated by jumping from the platform — all those who mustered in the accommodation block did not survive",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "All 61 survivors escaped by independently choosing to jump from lower decks into the sea rather than following the standing muster procedure. None of the workers who mustered in the accommodation block as directed survived. This contrast is a defining factual outcome of the emergency response.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "5e2578cb-4319-43d5-a58b-4780c180b692",
                                                       "4c8a2085-4932-4b74-90c9-d261cc61d148"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  7998,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Platform Workforce (general) who followed the emergency muster procedure and sheltered in the accommodation block did not survive",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Those members of the platform workforce who followed the standing emergency procedure and mustered in the accommodation block received no instruction to evacuate and did not survive. The muster protocol, designed for contained fires, directed workers into the path of the catastrophic escalation.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "4c8a2085-4932-4b74-90c9-d261cc61d148"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  7998,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "5a06f67d-57f2-4444-abfe-e41ba9816bcc",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Audit Safety-Critical Procedure Effectiveness",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators — senior management / HSE",
                               "action_type":  "corrective",
                               "description":  "Training, monitoring, and auditing of safety-critical procedures including permit to work must be demonstrably effective. Management must not regard the absence of reported problems as confirmation that systems are working correctly."
                           },
        "pos_x":  10866,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "5a0f0b16-008e-41a7-b841-d9bd125aa25a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "OIMs Of Claymore And Tartan Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Witness testimony — OIMs of Claymore and Tartan, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The OIM of the Claymore platform stated to the Cullen Inquiry that he had no permission from the Occidental control centre to shut down its condensate export line. The OIM of Tartan stated he had been directed by his superiors to cut upflow, but both platforms kept their export pipelines live after the first explosion.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363722192-d6916813-6514-4f04-876a-1ec43d063b60-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  6912,
        "pos_y":  1824,
        "width":  216,
        "height":  144
    },
    {
        "id":  "5b5b60cb-1b15-4b66-affb-f787b19d0494",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Temporary Safe Refuge",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Design / Engineering",
                               "description":  "Temporary safe refuge - no blast and fire-rated temporary refuge existed on the platform capable of protecting personnel for long enough to mount a rescue. The accommodation block served this role by default but was not designed for it.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "missing"
                           },
        "pos_x":  7242,
        "pos_y":  1800,
        "width":  216,
        "height":  144
    },
    {
        "id":  "5cc74fda-06a6-4a1a-a9ed-b3067d10dc82",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Conduct Regular Full Evacuation Drills",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "OIM / platform operator",
                               "action_type":  "corrective",
                               "description":  "Emergency drills and exercises must be conducted at a frequency required by procedure. A full evacuation drill must be carried out regularly. Cullen found that Piper Alpha had not conducted a full drill in over three years."
                           },
        "pos_x":  5040,
        "pos_y":  2184,
        "width":  216,
        "height":  144
    },
    {
        "id":  "5ccb3751-60cf-43dd-a9a0-3448f15e5cbd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_outcome",
        "heading":  "Maximum Reasonable Platform Loss Scenario",
        "color_hex":  "#EF4444",
        "created_by_user_id":  "420266a0-2087-4f36-8c28-340443dd1a82",
        "element_config":  {
                               "likelihood":  "likely",
                               "risk_level":  "extreme",
                               "consequence":  "severe",
                               "description":  "Total destruction of the platform and all connected infrastructure, with no survivors and a large-scale regional environmental catastrophe from uncontrolled well blowout.",
                               "consequence_category":  "maximum_reasonable"
                           },
        "pos_x":  11548,
        "pos_y":  -872,
        "width":  216,
        "height":  216
    },
    {
        "id":  "5e2578cb-4319-43d5-a58b-4780c180b692",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "61 Survivors\nWorkers who escaped by jumping or were rescued from the sea",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Witness"
                           },
        "pos_x":  3672,
        "pos_y":  744,
        "width":  96,
        "height":  144
    },
    {
        "id":  "63663d0e-39e3-4fff-9827-217353a58416",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Firewater Deluge System Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — platform operations crew, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The firewater deluge system was in manual mode at the time of the emergency. Survivors confirmed it had been switched to manual due to diving operations below the platform. It was not activated at any point during the emergency, either automatically or manually.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363647523-023ff350-d430-475b-ad22-f46f5356f89c-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  5040,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "63e04628-d351-46e1-bd15-8c4858d00399",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Accommodation Block Collapsed With Personnel Inside",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The accommodation block was not rated for blast and thermal loading from a major riser explosion and collapsed with 87 men still inside.",
                               "confidence_level":  "high"
                           },
        "pos_x":  7878,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "648b7f72-07eb-421e-b202-3e81c5e38d95",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "UK offshore safety regulation was prescriptive rather than goal-setting, requiring rule compliance rather than demonstrated hazard control",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "UK offshore safety regulation required operators to comply with specific prescriptive rules rather than to demonstrate systematic control of major hazards. This meant fundamental safety management failures at Occidental were not identified or enforced against by the regulator.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [

                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  13038,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "64efb941-cf40-4fcd-893c-a671e9aa0701",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Fire And Gas Alarms Activate",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Platform-wide",
                               "timestamp":  "1988-07-06T22:01",
                               "description":  "Automatic fire and gas detection activates alarms throughout the platform. The public address system is damaged and functioning only in some areas. Workers in the accommodation block are unaware of the severity or location of the fire."
                           },
        "pos_x":  5044,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "651bb426-f34c-4d8f-9601-3fd6da0b0443",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Condensate Pump B Trips",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Module C -- condensate injection area",
                               "timestamp":  "1988-07-06T21:45",
                               "description":  "Condensate Pump B, the operating unit, trips and fails to restart automatically. With no condensate injection, gas production begins to back up, threatening output to the export pipeline."
                           },
        "pos_x":  2160,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "653eb7f3-0dab-44a6-81f4-6742c8d49711",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "All Survivors Jumped From Platform",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "All 61 survivors escaped by independently jumping from the platform. None of those who followed the muster procedure survived.",
                               "confidence_level":  "high"
                           },
        "pos_x":  8610,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "67ac90e3-3ef6-4ed7-be16-980fe9edcf26",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Module C was located in close proximity to other process modules, meaning an explosion there immediately compromised adjacent areas",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The condensate injection module (Module C) was positioned in close proximity to adjacent process modules. This layout meant that the initial explosion immediately compromised adjacent areas and safety systems, accelerating the escalation of the incident.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [

                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  10446,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "69831e79-5aa7-4567-9286-e64c842c0657",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Document Full Evacuation And Rescue Plans",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / OIM",
                               "action_type":  "corrective",
                               "description":  "Every installation must have a documented and tested plan for safe and full evacuation, escape, and rescue covering all credible major accident scenarios including catastrophic platform-wide emergencies requiring full abandonment."
                           },
        "pos_x":  4320,
        "pos_y":  1848,
        "width":  216,
        "height":  144
    },
    {
        "id":  "6a4a05f4-4605-47e7-8e85-c5faff2d40e7",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) did not require formal safety cases or systematic major hazard risk assessments for platform operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system did not require the production of formal safety cases or systematic major hazard risk assessments. Without these, the major accident risks of the platform — including the condensate system and the connected gas risers — were never formally evaluated or managed.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  11766,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "6bd9ad35-bd9b-4697-b526-4f63f94ed219",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Recovered Documents Preserved For Inquiry",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "scene_preservation",
                               "description":  "Documents recovered from the accommodation block during the Flotta examination, including maintenance logs, permits, and operational records, were preserved as evidence and submitted to the Cullen Inquiry. These formed a key part of the documentary evidence base given that the process modules were not recovered from the seabed."
                           },
        "pos_x":  8568,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "6c8982e1-fc23-4d01-9790-82e7e3fba36a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "MV Silver Pit Standby Vessel",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Marine Operations",
                               "description":  "MV Silver Pit standby rescue vessel - on station and responded immediately. Recovered the majority of the 61 survivors from the sea. Two divers from Silver Pit entered the water to assist survivors and lost their lives.",
                               "barrier_role":  "recovery",
                               "control_type":  "engineering",
                               "barrier_state":  "effective"
                           },
        "pos_x":  10866,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "6f14b8da-fe32-4ada-a5e1-63dd9c864159",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Production Pressure Influenced Pump A Start",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Production pressure influenced the decision to start Pump A without full verification of its safe state.",
                               "confidence_level":  "medium"
                           },
        "pos_x":  11646,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "6f843cb9-6cb5-410a-b5de-ddeddec7a022",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Sea Rescue And Survivor Recovery",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "normal",
                               "description":  "Sea rescue and survivor recovery. Recovery of survivors from the sea by Silver Pit, Tharos rescue craft, and subsequently military and Coast Guard helicopters.",
                               "environmental_context":  "Rescue operations were carried out effectively given the circumstances. Support vessels were onsite and responded promptly. The primary limiting factor was the number of survivors who had reached the water, those who remained on the platform could not be reached."
                           },
        "pos_x":  9572,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "6f94facb-447b-40ad-834d-ac3ba317ef00",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift OIM did not conduct a formal shift handover briefing with the incoming night shift OIM covering outstanding maintenance and open permits",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The outgoing Day Shift OIM did not conduct a structured verbal handover briefing with the incoming night shift OIM. The open PTW for PSV-504 and the dangerous isolated state of Pump A were not communicated, leaving Colin Seaton to take command without knowledge of the outstanding hazard.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "6fd090b3-9c2a-4ae3-9874-afc8ba3dbf51",
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  2160,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) did not receive or seek a formal handover briefing covering outstanding maintenance and open permits",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Colin Seaton assumed command of the platform without receiving a formal handover briefing from the outgoing OIM and without seeking one. He was unaware of the open PSV-504 permit and the dangerous state of Pump A when he authorised its start later that night.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "2d76db89-09d0-4842-888a-f096eb00129d"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  2160,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "6fd090b3-9c2a-4ae3-9874-afc8ba3dbf51",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Day Shift OIM\nOffshore Installation Manager -- day shift (name not publicly recorded)",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responsible Leader"
                           },
        "pos_x":  792,
        "pos_y":  744,
        "width":  96,
        "height":  144
    },
    {
        "id":  "719a638b-6813-4cab-bdff-20342ec3556f",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Safety Management System Was Inadequate",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system did not require safety cases, major hazard assessments, or audited PTW compliance.",
                               "confidence_level":  "high"
                           },
        "pos_x":  9150,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "724c2ab2-a798-4e39-a08d-ad93d2af8c90",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The accommodation block was physically connected to and immediately adjacent to the main process deck",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The accommodation block was positioned directly adjacent to the main process deck, placing the primary emergency muster area inside the escalation path of a major process fire. This layout meant that once the fire escalated to the riser area, the primary place of shelter was directly exposed to the catastrophic explosion.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  7362,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "738f9908-6954-4644-8d2b-2df87e848328",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No dedicated emergency communications link existed between Piper Alpha and the OIMs of connected neighbouring platforms",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No direct emergency hotline or dedicated communications link existed between Piper Alpha\u0027s control room and the OIMs of Tartan and Claymore. This absence made rapid coordination for an emergency pipeline shutdown dependent on the general radio network, which was compromised by the emergency itself.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  9270,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "73ab3056-5c3a-4dd1-a701-d2a083075958",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had not commissioned a formal quantitative risk assessment of the condensate system and riser configuration",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Piper Alpha had not been subject to a formal quantitative or qualitative major hazard review that would have identified the specific risk profile of the condensate injection system and the connected gas risers. Had such a review been conducted, the absence of automated riser isolation and the deluge manual-mode practice would likely have been identified.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  11082,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "7412a8b4-7f6c-460f-acf5-6e26fdcdec8b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Pump A Taken Out For Maintenance",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Module C -- condensate injection area",
                               "timestamp":  "1988-07-06T12:00",
                               "description":  "Condensate Pump A taken out of service for routine maintenance. Safety relief valve PSV-504 is physically removed and a blind flange fitted to the open pipe spool. The pump is tagged out of service.",
                               "incident_detail_open":  false
                           },
        "pos_x":  0,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "741ce3b6-6a8e-4884-aaa1-b3da53a97ce9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "MV Tharos Crew Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Witness testimony — MV Tharos crew, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The crew of MV Tharos gave evidence to the Cullen Inquiry describing their approach to the platform, the firefighting attempt, and their forced withdrawal due to heat and debris before the second explosion. Their account establishes the state of the fire between the first and second explosions.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363741729-c3662e2f-7a75-4e7f-86c5-d6c5efb0c36b-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  8610,
        "pos_y":  1624,
        "width":  216,
        "height":  144
    },
    {
        "id":  "752ce158-f115-476f-a4a7-e9a91f23ecb0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "No Abandon Order Survivor Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — multiple witnesses, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "No abandon-platform order was issued by the OIM at any point during the emergency. Survivors who remained in the accommodation block stated they received no instruction to leave. Those who survived did so by independently choosing to jump from lower decks.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363670232-b92da021-bd59-46f5-a634-75c1d9659386-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  5784,
        "pos_y":  1632,
        "width":  216,
        "height":  144
    },
    {
        "id":  "762345a0-f5de-434b-9b16-a58599e608d8",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Firewall Panels Failed On First Explosion",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The firewall panels between modules failed on the first explosion, allowing fire to spread immediately into adjacent areas.",
                               "confidence_level":  "high"
                           },
        "pos_x":  3600,
        "pos_y":  2016,
        "width":  216,
        "height":  144
    },
    {
        "id":  "776ff955-2a99-4da6-a1c3-9aa0e3646744",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Automatic Firewater Deluge System",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Operations / OIM",
                               "description":  "Automatic firewater deluge system - present on the platform but switched to manual mode due to diving operations below the platform. It was not activated at any point during the emergency, either automatically or manually.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed",
                               "body_display_mode":  "description"
                           },
        "pos_x":  5784,
        "pos_y":  1200,
        "width":  216,
        "height":  144
    },
    {
        "id":  "77a2bdd5-1e6e-454f-b6ca-f88aca10d687",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Regulator Failed To Identify Deficiencies",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Department of Energy\u0027s regulatory regime failed to identify or enforce against Occidental\u0027s safety management deficiencies prior to the incident.",
                               "confidence_level":  "high"
                           },
        "pos_x":  10326,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "79049d0b-42b7-496f-a7c1-0b1ba1f63924",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Occidental Safety Management System",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Occidental Senior Management",
                               "description":  "Occidental safety management system - Occidental operated a safety management system that did not require formal safety cases, systematic major hazard assessments, or audited PTW compliance. Lord Cullen found it to be fundamentally inadequate.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  9786,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7a3680d1-13cd-4831-8797-7ff23ee151f5",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No independent or redundant emergency communications system existed on the platform separate from the main PA system",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform had no backup or redundant emergency communications capability independent of the main public address system. When the PA system was destroyed by the first explosion, there was no alternative means of directing personnel across the platform during the emergency.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  5784,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "7aae50ff-1018-4b21-9804-c502cf145065",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "No Formal Shift Handover Briefing",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No formal handover briefing was given by the outgoing OIM or production team to the incoming night shift.",
                               "confidence_level":  "high"
                           },
        "pos_x":  1464,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7b7e6632-2e50-465f-8209-93c699184ea7",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Public Inquiry Announced",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "scene_preservation",
                               "description":  "The UK government announced a formal public inquiry under Lord Cullen within one week of the disaster. The inquiry ran for 180 days over 13 months, heard evidence from survivors, expert witnesses, and platform personnel, and produced the Cullen Report in November 1990."
                           },
        "pos_x":  9744,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7cd2adfb-df1e-461c-bc0f-191d4512153a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No requirement existed for the OIM to seek a second opinion or consult engineering before acting on a permit to work during night operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No procedural requirement existed for the Night Shift OIM to consult the relevant engineer or maintenance supervisor before authorising action on a safety-critical permit during night operations. This meant the authorisation of Pump A\u0027s start rested on a single person\u0027s interpretation of a paper permit.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  2880,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "7cf95d01-5e87-4104-add6-feffba107aa3",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lifeboat stations were inaccessible due to fire and smoke, preventing their use as the primary evacuation route",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s primary enclosed lifeboats and lifeboat stations were rendered inaccessible by the location of the fire and smoke from the initial explosion. This eliminated the primary planned evacuation route before any organised evacuation was attempted.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "people_involved":  [

                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  7362,
        "pos_y":  64,
        "width":  168,
        "height":  96
    },
    {
        "id":  "7d37972d-6639-4f06-af8b-78ec1f6915d0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Mayday Radio Transmission",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Mayday radio transmission — Piper Alpha radio room",
                               "media_mime":  "",
                               "media_name":  "",
                               "description":  "Radio operator David Kinrade transmitted a Mayday from Piper Alpha at approximately 22:04. This is the last formal distress signal from the platform and establishes that the control room was still operational at that point. No abandon-platform order accompanied or followed this transmission.",
                               "evidence_type":  "record",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "",
                               "show_canvas_preview":  false
                           },
        "pos_x":  4320,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7d8c66ed-1ccf-4664-b148-922580f17d6b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lead Production Operator (night shift) acted under production continuity pressure when deciding to seek authorisation to start Pump A",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Lead Production Operator (night shift) was operating under production continuity pressure following the trip of Pump B. This pressure influenced the speed and quality of the decision to locate and act on the Pump A permit without fully verifying its safe state.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "30bc0683-49e4-46d5-8edf-2501a08469ee",
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf",
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "body_display_mode":  "description",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  3600,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) was under production continuity pressure when he authorised the start of Pump A",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Colin Seaton authorised the start of Pump A at a time when production was backing up following the Pump B trip. Production continuity pressure contributed to the speed of the decision and the absence of independent verification before authorisation was granted.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "2d76db89-09d0-4842-888a-f096eb00129d"
                                                   ],
                               "body_display_mode":  "description",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  3600,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) created an organisational environment in which production continuity pressure influenced operational decisions",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s organisational culture and commercial priorities created an environment in which production continuity was a dominant consideration for platform personnel. This pressure context predisposed the night shift team to seek rapid solutions to the Pump B trip without the level of caution that the permit situation required.",
                               "influence_type":  "organisational",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "body_display_mode":  "description",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  3600,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "7dac6b76-b9fe-4acb-be25-6eb15fffa5a6",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Survivors Transported For Medical Treatment",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "medical_treatment",
                               "description":  "61 survivors were brought aboard Silver Pit, Tharos, and rescue helicopters and transported to shore. On arrival they received emergency medical assessment and treatment for burns, smoke inhalation, hypothermia, and blast injuries at hospitals in Aberdeen."
                           },
        "pos_x":  6456,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7e3cf222-7e69-4c3b-b34e-b4aefb28cf6c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Fire And Gas Detection System",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Operations / Maintenance",
                               "description":  "Automatic fire and gas detection and alarm system - functioned correctly, detecting the condensate release and initial explosion and triggering the general platform alarm.",
                               "barrier_role":  "preventive",
                               "control_type":  "engineering",
                               "barrier_state":  "effective"
                           },
        "pos_x":  4320,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "7f2d620e-03b0-4973-a8e5-cb325d0c5995",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The first explosion disabled significant portions of the deluge pipework, rendering manual activation partially ineffective",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The first explosion physically damaged significant portions of the deluge pipework and pumping infrastructure. Even had manual activation been attempted after the initial blast, the system\u0027s capacity to suppress the fire would have been substantially reduced.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  4320,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "84b1ff39-1d6a-4812-bfc6-3a1e71e00974",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Public Address System Destroyed",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The public address system was destroyed by the first explosion, eliminating the primary means of communicating an evacuation order.",
                               "confidence_level":  "high"
                           },
        "pos_x":  4320,
        "pos_y":  1632,
        "width":  216,
        "height":  144
    },
    {
        "id":  "852c620c-d717-41dc-95c1-119129175ba5",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Accommodation Block Integrity",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Design / Engineering",
                               "description":  "Accommodation block structural and fire integrity - the block was not designed to withstand the blast and thermal loading of a major gas riser explosion. It was structurally compromised by the second explosion and collapsed into the sea.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed"
                           },
        "pos_x":  7878,
        "pos_y":  1448,
        "width":  216,
        "height":  144
    },
    {
        "id":  "85c0ec09-e67b-4d7c-bb5c-aaed098a58b8",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The Claymore pipeline riser failed under sustained fire, causing a third explosion that accelerated the structural collapse",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "With the Claymore platform still pumping live hydrocarbons through its connected pipeline, the Claymore riser also failed under sustained fire. The resulting third explosion accelerated the progressive structural collapse of the central platform sections.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  9270,
        "pos_y":  -560,
        "width":  168,
        "height":  96
    },
    {
        "id":  "87a33cea-60be-410f-b8aa-6d81e247e46b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Regulatory Safety Inspection And Enforcement",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Department of Energy (Regulator)",
                               "description":  "Regulatory safety inspection and enforcement - the Department of Energy held responsibility for offshore safety but had not identified or acted on the known deficiencies in Occidental\u0027s PTW system, emergency procedures, or safety management prior to the incident.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  10326,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "88605d69-a2ef-42fd-952f-231ab7dc95f6",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Platform Fire Photographs",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Press photographers — aboard neighbouring vessels and aircraft",
                               "media_mime":  "image/jpeg",
                               "media_name":  "Photographs taken from.jpg",
                               "description":  "Photographs taken from neighbouring vessels captured the platform on fire on the night of 6 July 1988. These images are used during the Cullen Inquiry to establish the fire progression and the state of the platform at various points during the escalation sequence.",
                               "evidence_type":  "photo",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363625578-f4851068-a893-4ec2-a520-339db6e9277c-photographs-taken-from.jpg",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  3600,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "89597a36-527f-4d4a-9802-52411853ff20",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Sunken Process Modules Not Recovered",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "scene_preservation",
                               "description":  "The decision was made by the Cullen Inquiry not to recover the sunken process modules from the seabed, due to the time required, the hazards involved, and the low likelihood that the evidence would be usable. The seabed wreckage site was formally documented and recorded as part of the inquiry process."
                           },
        "pos_x":  9096,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "895afa8d-0299-4a04-94fd-7deb7e1ff51e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No criteria or trigger thresholds were defined for when the OIM was required to issue an abandon platform order",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s emergency command structure did not define clear criteria, thresholds, or conditions under which the OIM was required to issue an abandon platform order. This left the decision entirely to individual judgement in conditions of rapidly degrading situational awareness.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  5784,
        "pos_y":  504,
        "width":  168,
        "height":  96
    },
    {
        "id":  "89ad76dd-d7a5-49e3-b63e-63723c2a5e93",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Emergency Mustering In Accommodation Block",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Emergency mustering. Assembly of platform personnel at designated muster stations in accordance with the platform emergency response plan.",
                               "environmental_context":  "Workers mustered in the accommodation block as per standing procedure, which was designed for contained fires, not a catastrophic platform-wide emergency. The procedure followed correctly but was inappropriate for the scale of the event unfolding."
                           },
        "pos_x":  6480,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "8a7aa471-b2c3-41dd-8866-791c93ce6e5a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Pipeline risers were not fitted with automated emergency isolation valves capable of closing under fire or remote command",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No remotely or automatically actuated isolation valves were installed on the Tartan or Claymore pipeline risers at Piper Alpha. Without these, cutting off the hydrocarbon supply to the riser fires required active decisions and communications across multiple platforms — a process that failed.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  9270,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "8dabbe00-fab3-4eb5-8c6f-235db09b442e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) authorised the start of Pump A without independently verifying its physical state or consulting the maintenance team",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Colin Seaton granted verbal authorisation for the start of Condensate Pump A solely on the basis of the Lead Production Operator\u0027s interpretation of the open permit. He did not independently verify the physical state of the pump, consult the outgoing maintenance team, or seek engineering advice before authorising the start.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  2880,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "8e15eea3-40bf-4d0d-a0fe-24b984308ea7",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Platform Workforce (general) followed emergency muster procedures that directed them to the accommodation block — an unsuitable refuge in a catastrophic platform fire",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform workforce followed standing emergency muster procedures that directed all personnel to assemble in the accommodation block. Those procedures were designed for contained fires and were wholly inappropriate for a catastrophic platform-wide emergency, directing workers into the path of escalation.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "4c8a2085-4932-4b74-90c9-d261cc61d148",
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  5784,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had approved emergency muster procedures that directed workers to the accommodation block in all emergency scenarios",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s approved emergency muster procedure directed all platform personnel to the accommodation block regardless of the nature or scale of the emergency. The procedure had never been reviewed against a catastrophic major accident scenario and was not fit for purpose in the conditions that arose.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  5784,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "8efeda40-b7b8-4cd6-a7f1-76507a2a70d6",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Firewater Deluge System Operation",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Firewater deluge system operation. Activation of the platform\u0027s automatic deluge fire suppression system to oppose the fire in the affected modules.",
                               "environmental_context":  "The deluge system had been placed in manual mode, as was common practice when divers were working in the water below the platform, to prevent accidental activation. It was not activated during the emergency, significantly reducing fire suppression capability."
                           },
        "pos_x":  8300,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "9213ce47-8d0f-4e88-99b8-c98bf0743fc2",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Neighbouring Platforms Continue Pumping",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Tartan \u0026 Claymore platforms / subsea pipelines",
                               "timestamp":  "1988-07-06T22:05",
                               "description":  "Neighbouring platforms Tartan and Claymore continue pumping oil and gas through their pipelines connected to Piper Alpha, having received no shutdown instruction. The pipelines remain live and fully pressurised.",
                               "body_display_mode":  "description"
                           },
        "pos_x":  7152,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "960d4749-826e-4db0-8ec1-8bc16781b509",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Coast Guard And RAF Rescue Helicopters",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "HM Coastguard / RAF",
                               "description":  "Coast Guard and RAF search and rescue helicopters - deployed overnight and assisted in survivor recovery alongside the support vessels.",
                               "barrier_role":  "recovery",
                               "control_type":  "administrative",
                               "barrier_state":  "effective"
                           },
        "pos_x":  11646,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "969d7314-be22-41c9-8c11-3f33f9143fb9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "PTW Review For Condensate Pump A",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Permit to work review. Checking the control room permit system to determine whether Condensate Pump A was available to be started as a backup.",
                               "body_display_mode":  "description",
                               "environmental_context":  "The permit was located but misinterpreted under production pressure. The operator lacked full understanding of what the blind flange represented. No independent verification was sought. Time pressure and production continuity concerns influenced the decision."
                           },
        "pos_x":  2880,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "98628a13-da5b-4f69-bb11-778616f9640a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Tartan Gas Riser Fails",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Tartan riser / north end of platform",
                               "timestamp":  "1988-07-06T22:50",
                               "description":  "The Tartan gas riser fails catastrophically. A second, far larger explosion produces a fireball that engulfs the north end of the platform and the accommodation block. The accommodation block is structurally compromised. This explosion is the primary cause of mass casualties."
                           },
        "pos_x":  9052,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "9a7159aa-9196-444a-bd8a-490683f6f7b6",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Claymore Riser Fails",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Claymore riser / central platform",
                               "timestamp":  "1988-07-06T23:20",
                               "description":  "The Claymore pipeline riser also fails. A third major explosion accelerates the structural collapse of the central platform sections. Fires continue at extreme intensity fuelled by the still-flowing subsea pipelines."
                           },
        "pos_x":  10228,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "9b9be25d-bcd2-4e9e-a266-c842bd919abb",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Cross-Platform Pipeline Shutdown Protocol",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Occidental / Texaco Operations Management",
                               "description":  "Cross-platform emergency pipeline shutdown protocol - no documented protocol existed requiring or enabling the OIMs of Tartan and Claymore to shut down their export pipelines to Piper Alpha in an emergency. Pipelines continued to flow, feeding the riser fires that caused the second and third explosions.",
                               "barrier_role":  "mitigative",
                               "control_type":  "administrative",
                               "barrier_state":  "missing"
                           },
        "pos_x":  8610,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "9c12ee5c-f615-42bf-8337-9604b87f0cff",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Condensate Pump A Start-Up",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Condensate pump start-up. Physical starting of Condensate Pump A to restore condensate injection and maintain gas production output.",
                               "environmental_context":  "The pump was started while PSV-504 was absent and the open pipe spool was fitted only with an unrated blind flange. The action was taken in good faith but on the basis of incomplete and misunderstood hazard information."
                           },
        "pos_x":  4320,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "9e3943e1-a67c-43a8-bd2c-1d7dbbf10b42",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Pump Monitoring And Fault Response",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Pump monitoring and fault response. Routine monitoring of condensate pump operation and responding to an unexpected trip of the operating pump.",
                               "body_display_mode":  "description",
                               "environmental_context":  "Condensate Pump B tripped unexpectedly at night, creating production pressure and a time-sensitive decision alternative. Night shift was operating with incomplete knowledge of the status of the standby pump."
                           },
        "pos_x":  2160,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "9ee72e57-bbda-4094-aae1-2565f37ed5ac",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Emergency Command And Evacuation Decision",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Emergency command and evacuation decision. OIM assessment of the emergency and decision on whether to order platform abandonment.",
                               "environmental_context":  "No abandon platform order was issued. The OIM was likely operating with limited situational awareness due to communications damage, smoke, and the rapidly escalating nature of the event. Emergency command procedures did not clearly define criteria for platform abandonment."
                           },
        "pos_x":  7028,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "a157330c-8a68-4d3d-8838-edb257156315",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "First Explosion In Module C",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Module C / Module B firewall",
                               "timestamp":  "1988-07-06T22:00",
                               "description":  "First explosion in Module C as the vapour cloud ignites. The blast breaches firewall panels between modules, injures personnel, and disables portions of the deluge fire suppression system."
                           },
        "pos_x":  4320,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "a31c6e58-f251-4988-9caf-888253b8b785",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Ignition Sequence Not Conclusively Established",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The precise ignition sequence between the Pump A start and first explosion could not be conclusively established due to the loss of physical evidence to the sea.",
                               "confidence_level":  "low"
                           },
        "pos_x":  12378,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "a5ae8658-e6cc-4f69-a013-228f589d1a14",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Fire And Gas Detection Response",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "normal",
                               "description":  "Fire and gas detection response. Automatic activation of fire and gas detection systems following the initial condensate release and explosion.",
                               "environmental_context":  "Detection systems functioned as designed. However, the public address system was partly disabled by the first explosion, limiting the effectiveness of the alarm in communicating urgency to workers in the accommodation block."
                           },
        "pos_x":  5040,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "a67b5e50-77ed-427b-a9c1-bb7210f653fc",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "No Cross-Platform Shutdown Protocol",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No cross-platform emergency shutdown protocol existed or was invoked to isolate the connected pipelines.",
                               "confidence_level":  "high"
                           },
        "pos_x":  7242,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "a707d4ef-8135-415a-8c54-134d311a57f4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Pump A Permit Located And Authorised",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Control room",
                               "timestamp":  "1988-07-06T21:52",
                               "description":  "The night shift lead production operator locates the permit for Pump A in the control room. He interprets the blind flange as a sufficient temporary cap and requests verbal authorisation from the OIM to start Pump A. Authorisation is given."
                           },
        "pos_x":  2880,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "a85b8ae5-8782-4679-866e-75ca56e4ae7c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Improve Standby Vessel Rescue Capability",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Standby vessel owners",
                               "action_type":  "corrective",
                               "description":  "Standby vessel owners must ensure their vessels and crews are capable of effective rescue in a major offshore emergency. This was a recommendation directed specifically at standby ship owners."
                           },
        "pos_x":  11646,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "a94a9df3-0b25-443c-aec4-c91af906d834",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Require Basic Offshore Survival Training",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / training providers",
                               "action_type":  "corrective",
                               "description":  "All personnel must complete a basic offshore emergency survival course before being permitted to work offshore."
                           },
        "pos_x":  5784,
        "pos_y":  2424,
        "width":  216,
        "height":  144
    },
    {
        "id":  "aaf35c72-7235-48c9-a2b8-3bb73c64870a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Build Positive Safety Culture",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators — senior management",
                               "action_type":  "preventive",
                               "description":  "Operators must establish and maintain a positive safety culture in which safety is genuinely the number one priority, management actively encourages reporting of concerns, and workers are able to raise safety issues without fear of consequence."
                           },
        "pos_x":  10326,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "acfc6d10-8696-4d30-b401-822ff8fd2390",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "MV Silver Pit Crew\nStandby rescue vessel crew -- recovered most survivors from the sea",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responder"
                           },
        "pos_x":  6552,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "ad404650-c540-4f57-8b36-f6709626203b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lead Production Operator (night shift) was operating under the reduced situational awareness and increased cognitive load of night-time operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Night-time operations reduced situational awareness and increased cognitive load for the Lead Production Operator when he was required to make the critical decision about Pump A. These conditions predisposed him to a faster, less thorough assessment of the permit and the equipment\u0027s safe state.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "30bc0683-49e4-46d5-8edf-2501a08469ee",
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  13038,
        "pos_y":  -768,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) was operating under the reduced situational awareness and increased cognitive load of night-time operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Night-time operations placed Colin Seaton in a decision-making environment of reduced visibility, reduced manning, and increased cognitive load when he was asked to authorise the start of Pump A. These conditions predisposed him to a faster, less rigorous authorisation decision.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "2d76db89-09d0-4842-888a-f096eb00129d"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  13038,
        "pos_y":  -768,
        "width":  168,
        "height":  96
    },
    {
        "id":  "ae6ef1b2-befc-4ca8-8f75-b4e1338a7d3a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Deluge System Left In Manual Mode",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The firewater deluge system was in manual mode and was not activated at any point during the emergency.",
                               "confidence_level":  "high"
                           },
        "pos_x":  3600,
        "pos_y":  1800,
        "width":  216,
        "height":  144
    },
    {
        "id":  "aef721d0-5358-4b4c-9884-b8921354abbd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Fit Remote Subsea Isolation Valves",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / pipeline operators",
                               "action_type":  "corrective",
                               "description":  "Gas risers and subsea pipelines must be fitted with subsea isolation valves capable of closing automatically or by remote command, to cut off the flow of hydrocarbons from connected platforms in the event of a major fire or emergency."
                           },
        "pos_x":  7878,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "afae3d85-7809-4fbd-b34f-9742004a2398",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Provide Rated Temporary Safe Refuge",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / platform designers",
                               "action_type":  "corrective",
                               "description":  "Every offshore installation must provide a temporary safe refuge, a designated area rated to protect personnel for sufficient time to assess the emergency and prepare for evacuation. The accommodation block would normally serve this role but must be upgraded to meet fire, blast, smoke, and gas ingress standards."
                           },
        "pos_x":  3600,
        "pos_y":  2232,
        "width":  216,
        "height":  144
    },
    {
        "id":  "b0af7727-96f3-48e0-b1aa-d24f91c7fdf0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The public address system was destroyed by the first explosion, eliminating the primary means of directing personnel",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s public address and internal communications system was physically destroyed by the first explosion. This eliminated the primary means of issuing emergency instructions to personnel across the platform, including any abandon platform order, even had one been authorised.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "people_involved":  [

                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  6480,
        "pos_y":  -120,
        "width":  168,
        "height":  96
    },
    {
        "id":  "b10b427f-a4fc-4fd5-9fb0-9480b89dd554",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "Occidental Petroleum Senior Management (onshore)\nCorporate management responsible for platform safety systems and procedures",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responsible Leader"
                           },
        "pos_x":  8610,
        "pos_y":  712,
        "width":  240,
        "height":  120
    },
    {
        "id":  "b1659f95-36c4-44b1-b913-e5d8500fb574",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Connected Pipelines Shut Down",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "make_area_safe",
                               "description":  "Occidental Petroleum instructed Tartan and Claymore platforms to shut down their export pipelines feeding Piper Alpha, cutting off the primary fuel source sustaining the riser fires. This occurred after the second major explosion."
                           },
        "pos_x":  3672,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "b2179c7a-eff6-42d0-9e3f-df151cc21c4c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Tharos Attempts Firefighting",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Sea -- alongside platform",
                               "timestamp":  "1988-07-06T22:20",
                               "description":  "Tharos reaches the platform and attempts firefighting with its water monitor cannons. The vessel is forced to withdraw due to the intensity of heat and falling debris."
                           },
        "pos_x":  8512,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "ba24bbda-00f7-4114-a6cb-62c1a34afecd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Maintain And Test Emergency Equipment",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators — maintenance management",
                               "action_type":  "corrective",
                               "description":  "Emergency equipment, safety-critical systems, and firefighting equipment must be maintained and periodically tested to confirm fitness for purpose. Deficiencies must not be tolerated."
                           },
        "pos_x":  7242,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "ba45e04d-2e82-49c8-ae4d-bf7f2561e4da",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Barry Barber and Ian Fowler entered the water voluntarily to rescue survivors and both died in the attempt",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Barry Barber and Ian Fowler, divers from the MV Silver Pit, voluntarily entered the water alongside the burning platform to assist survivors who could not reach the rescue craft unaided. Both men died during the rescue attempt and represent the only rescuer fatalities of the incident.",
                               "influence_type":  "human",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "3575f6c3-16b4-45b3-826a-588e9c3bd9d1"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  13038,
        "pos_y":  -768,
        "width":  168,
        "height":  96
    },
    {
        "id":  "bb5c063e-9ead-4e81-9bc8-bd4c89cd2ffc",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "OIM -- Tartan Platform\nOffshore Installation Manager, Tartan (continued pumping, no shutdown order received)",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Involved - Indirect"
                           },
        "pos_x":  4392,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "bbc3ce56-59a4-4c27-8da5-ce5047ae0ef9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift Maintenance Technician(s) did not apply a physical lockout or tagout to Pump A at the equipment to prevent inadvertent start-up",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The day shift maintenance team did not apply any physical lock or warning tag to Pump A or its associated pipework at the equipment itself. No on-site indicator existed to warn night shift personnel that the pump was isolated in a dangerous state, leaving only the paper permit in the control room as the sole hazard signal.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd",
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  744,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had not established a requirement for physical lockout or tagout of isolated safety-critical equipment",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system did not require the physical lockout or tagging of isolated safety-critical equipment at the equipment itself. This systemic absence meant that a person could approach and start equipment under an open permit without encountering any physical barrier or warning.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  744,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "bbef4ef0-53a8-404c-97bf-6dd4aaa6f19e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Steve Rae Survivor Account",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — Steve Rae, published account",
                               "media_mime":  "image/png",
                               "media_name":  "Statement - Steve Rae.png",
                               "description":  "Steve Rae, a surviving platform worker, gave a detailed published account confirming that survivors acted on instinct and disregarded their emergency training. He confirmed no instruction to evacuate was received and that those who followed the muster procedure did not survive.",
                               "evidence_type":  "statement",
                               "body_display_mode":  "description",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363685172-ab8c82be-7b4e-466b-a976-d5311a560e25-statement---steve-rae.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  6480,
        "pos_y":  1416,
        "width":  216,
        "height":  144
    },
    {
        "id":  "bcff10b6-2ba0-422d-b5fc-03c286534794",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "OIM Lost Emergency Command Capability",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM lost effective situational awareness and command capability before the most critical evacuation decisions needed to be made.",
                               "confidence_level":  "medium"
                           },
        "pos_x":  11646,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "bd58ebbf-bae9-4e9d-8bd2-ef028ba15ebb",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No requirement existed to complete or reinstate safety-critical equipment before handing over to the next shift",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No procedural rule required maintenance work on safety-critical equipment to be completed, or the equipment reinstated to a safe defined state, before the shift could be handed over. This allowed Pump A to remain in a dangerous intermediate state across a shift boundary without any formal control.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  0,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "bdcfe065-26f8-4f49-9190-40b6864661ae",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Standby Vessel Firefighting Response",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Standby vessel firefighting response. Deployment of the Tharos firefighting vessel to combat the platform fire using its water monitor cannons.",
                               "environmental_context":  "Tharos reached the platform and attempted suppression but was forced to withdraw due to the scale of the fire and falling debris. The vessel\u0027s firefighting capacity was overwhelmed by the intensity of the burning gas risers."
                           },
        "pos_x":  8936,
        "pos_y":  480,
        "width":  260,
        "height":  120
    },
    {
        "id":  "be967dd7-668b-4936-8ce7-b6210deda816",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "OIM-To-OIM Shift Handover",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "OIM (outgoing)",
                               "description":  "OIM-to-OIM shift handover briefing - the outgoing day shift OIM did not brief the incoming night shift OIM on the open PSV-504 permit or the isolation state of Pump A.",
                               "barrier_role":  "preventive",
                               "control_type":  "administrative",
                               "barrier_state":  "failed"
                           },
        "pos_x":  1464,
        "pos_y":  1176,
        "width":  216,
        "height":  144
    },
    {
        "id":  "c0eb6177-00f7-4ee2-9d94-fe92eecb4715",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The Tharos water cannon capacity was insufficient to suppress a jet fire of the scale produced by the burning gas riser",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The MV Tharos firefighting vessel\u0027s water monitor cannons were overwhelmed by the scale of the jet fire produced by the burning Tartan gas riser. The vessel was forced to withdraw due to heat intensity and falling debris before the second explosion, removing the only active firefighting resource at the riser.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "f4b57273-45c1-4491-904d-e7b313cdcbe2"
                                                   ],
                               "factor_classification":  "neutral"
                           },
        "pos_x":  4320,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "c24ba5fe-38c1-4479-9dd8-c879825f29b0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Fire Engulfs Riser Area",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Riser area -- north-east corner of platform",
                               "timestamp":  "1988-07-06T22:20",
                               "description":  "Fire intensifies and engulfs the riser area where the Tartan gas pipeline connects to the platform. Sustained jet fire impinges directly on the Tartan riser, rapidly heating the high-pressure gas line."
                           },
        "pos_x":  7780,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "c2e587b4-8a87-4a90-9e3d-0a83319dc925",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "MV Tharos Firefighting Vessel",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Marine Operations",
                               "description":  "MV Tharos firefighting vessel - on station and responded immediately but its water monitor capacity was overwhelmed by the scale of the riser jet fire. The vessel was forced to withdraw due to heat and falling debris before the second explosion.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed"
                           },
        "pos_x":  5784,
        "pos_y":  1416,
        "width":  216,
        "height":  144
    },
    {
        "id":  "c7e7a334-8215-4485-be49-02b37367b437",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Pump A Start Authorised Without Verification",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM authorized the start of Pump A without independently verifying its physical state or consulting maintenance.",
                               "confidence_level":  "high"
                           },
        "pos_x":  2880,
        "pos_y":  1944,
        "width":  216,
        "height":  144
    },
    {
        "id":  "c8064132-14a9-4883-ac34-fad939d1420f",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift Maintenance Technician(s) did not complete the PSV-504 maintenance work within the shift in which it was started",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The day shift maintenance team removed PSV-504 from Pump A but did not complete the maintenance work within the same shift. This left the pump in a dangerous intermediate state overnight, with an open pipe spool and an unrated blind flange fitted in place of the valve.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  744,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "id":  "cad68b25-c471-4c04-ba7c-93ebd7d2e93e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No secondary means of escape to the sea existed from the accommodation block once the primary muster area became untenable",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Once conditions in the accommodation block became unsurvivable, no protected secondary escape route to sea level existed. Personnel who had mustered there as instructed had no means of reaching the sea other than by attempting to traverse exposed and burning deck areas.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  7998,
        "pos_y":  272,
        "width":  168,
        "height":  96
    },
    {
        "id":  "ced7e38c-3e7e-43d1-99f5-61bb2893f02e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Include PTW System In Safety Case",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "1992-01-01",
                               "owner_text":  "Offshore operators / HSE",
                               "action_type":  "corrective",
                               "description":  "The safety case must include a formal permit to work system as a documented component, with the system subject to audit as part of the safety case acceptance process."
                           },
        "pos_x":  1464,
        "pos_y":  1608,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d41292d1-0abe-486c-b27e-2197b1eb18a9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Lifeboats And Lifeboat Stations",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Platform Operations / Marine",
                               "description":  "Lifeboats and lifeboat stations - present on the platform but inaccessible during the emergency due to the location of fire and smoke. Could not be used as the primary evacuation route.",
                               "barrier_role":  "mitigative",
                               "control_type":  "engineering",
                               "barrier_state":  "failed"
                           },
        "pos_x":  7878,
        "pos_y":  1192,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d611a5bc-6d38-4221-8e92-0bca4ef21fbc",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Silver Pit Launches Rescue Craft",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "emergency_response",
                               "description":  "MV Silver Pit, on standby station near the platform, observed the initial explosion and immediately began moving toward Piper Alpha, launching fast rescue craft to recover survivors from the sea."
                           },
        "pos_x":  168,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d6aa4155-0e99-4acc-a2ac-d238242de704",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Connected Platforms Continued Pumping",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Tartan and Claymore continued pumping live hydrocarbons after the initial explosion, sustaining the riser fires that caused the second and third explosions.",
                               "confidence_level":  "high"
                           },
        "pos_x":  6480,
        "pos_y":  1944,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d75fb40b-70cb-4323-aa09-ab8b2df720cd",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "RAF Search And Rescue Deployed",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "emergency_response",
                               "description":  "RAF Lossiemouth scrambled a Sea King search and rescue helicopter at the request of HM Coastguard Aberdeen at approximately 22:05, following receipt of the Mayday. Further SAR assets including a Nimrod from RAF Kinloss were deployed to act as an on-scene commander."
                           },
        "pos_x":  2304,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d83cca0b-65b7-4375-ba82-16bc6f00c61e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_response_recovery",
        "heading":  "Remaining Structure Toppled Into Sea",
        "color_hex":  "#ec4899",
        "created_by_user_id":  null,
        "element_config":  {
                               "category":  "make_area_safe",
                               "description":  "The remaining structural sections of Piper Alpha were toppled into the sea on 28 March 1989 after the fires were extinguished, removing the hazard to navigation and subsea operations in the area."
                           },
        "pos_x":  5832,
        "pos_y":  3984,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d88e6f92-b00f-482e-b4d6-919b03f6e62c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Resolve Safety Audit Findings",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators — senior management",
                               "action_type":  "preventive",
                               "description":  "Operators must conduct periodic safety audits of their installations. Where problems with safety systems are identified, they must be resolved in a timely manner and not left outstanding."
                           },
        "pos_x":  6480,
        "pos_y":  2160,
        "width":  216,
        "height":  144
    },
    {
        "id":  "d935fb10-84b2-4060-a960-0cb752a282c1",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The firewater deluge system had been placed in manual mode and was not activated at any point during the emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s automatic firewater deluge system had been switched to manual mode earlier in the day due to diving operations below the platform and was never returned to automatic mode. At no point during the emergency was it activated, either automatically or manually, removing the primary fire suppression capability at the moment it was most needed.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  4320,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "d967065a-e01d-4840-a24b-bf3c05c3d45a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Tartan Gas Line Failure Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor and witness testimony — platform and vessel crews, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The Tartan gas line failed at approximately 22:20, releasing gas at an estimated 15 to 30 tonnes per second which immediately ignited. The timing and scale of this event was established by survivor accounts from the platform and from the Tharos and Silver Pit crews.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363731582-17d101be-9204-4db3-90d5-e0afb2f10d52-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  7878,
        "pos_y":  1624,
        "width":  216,
        "height":  144
    },
    {
        "id":  "daeafe75-62af-490a-bf73-99b8130049b9",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No designated deputy or command succession plan was in place to assume emergency command if the OIM became incapacitated",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No formal command succession plan or designated deputy existed to assume emergency command of the platform if the OIM became incapacitated or lost situational awareness. When Colin Seaton effectively lost command capability after the first explosion, no one was designated to take over.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  5784,
        "pos_y":  -360,
        "width":  168,
        "height":  96
    },
    {
        "id":  "de2680da-776a-4a3d-b042-e6cd16c10c9d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Colin Seaton (Night Shift OIM) did not contact the outgoing maintenance team or day shift supervisor to verify the status of the Pump A permit",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Before authorising the start of Pump A, Colin Seaton did not attempt to contact the outgoing day shift maintenance team or supervisor to verify what the open PTW meant in practice. A single phone call to the maintenance technician who had raised the permit would have revealed that the pump was in a dangerous, unrestorable state.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "2e5ce84b-5379-46a7-ab95-2660fcdfe8cf"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  3600,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "de2b897b-99cf-4872-9801-826f9e222314",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had not reviewed emergency response procedures to verify the accommodation block muster protocol was adequate for a catastrophic emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No systematic review of Piper Alpha\u0027s emergency response procedures had been conducted to test whether the accommodation block muster protocol was adequate for a major accident scenario. The procedure was accepted without challenge and remained in place until it directly contributed to mass casualties.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  12498,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "decaec65-a522-47a9-8670-7deb084c27d5",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_task_condition",
        "heading":  "Permit To Work Completion",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "state":  "abnormal",
                               "description":  "Permit to work completion. Formal documentation and sign-off confirming the status of ongoing maintenance work and associated hazard controls.",
                               "environmental_context":  "Work was not completed before end of shift. The permit was left open and stored in the control room without verbal communication to the incoming night shift, contrary to safe practice."
                           },
        "pos_x":  744,
        "pos_y":  504,
        "width":  216,
        "height":  144
    },
    {
        "id":  "defa680d-4fc2-4e64-b16e-277f95b6da24",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "No Platform-Wide Evacuation Order",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Accommodation block -- muster area",
                               "timestamp":  "1988-07-06T22:04",
                               "description":  "No platform-wide evacuation order is issued by the OIM. Workers muster at the primary assembly point in the accommodation block in accordance with standing emergency procedures.",
                               "body_display_mode":  "description"
                           },
        "pos_x":  6480,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "dfd932ee-8f96-4298-8a04-71acfc99911d",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "1978 Modifications Increased Hazard Profile",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s gas compression and condensate systems were added in 1978 without a redesign of safety systems, escape routes, or firewall ratings to match the increased hazard profile.",
                               "confidence_level":  "high"
                           },
        "pos_x":  9786,
        "pos_y":  2648,
        "width":  216,
        "height":  144
    },
    {
        "id":  "e05c788c-f423-4736-a176-5aefac04136a",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lead Production Operator (night shift) did not physically inspect Pump A or the pipe spool before seeking authorisation to start it",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Lead Production Operator (night shift) based his decision to seek start authorisation entirely on his interpretation of the paper permit in the control room. He did not physically go to Pump A or the pipe spool to inspect its condition before recommending the start to the OIM.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "30bc0683-49e4-46d5-8edf-2501a08469ee"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  3600,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e0cd3e32-dd99-40ba-9a3f-99778541387e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No independent inspection or second-person sign-off was required before acting on a safety-critical permit to work",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s PTW system did not require an independent second person to verify the physical state of safety-critical equipment before a permit was acted upon. This meant a single person\u0027s interpretation of a paper permit was sufficient to authorise the start of isolated and potentially hazardous equipment.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  0,
        "pos_y":  -360,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e0db6640-7cd3-40d7-b638-68f4192243a3",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had not conducted a systematic audit of permit to work compliance prior to the incident",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No systematic audit or review of permit to work compliance had been conducted at Piper Alpha prior to the incident. The weaknesses in the PTW system — including the absence of physical lockout, the absence of formal handover requirements, and the potential for permit misinterpretation — had not been identified or acted upon.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  11766,
        "pos_y":  -352,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e343564c-8e76-4edc-ab3a-337d88352f9e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "OIM — Tartan Platform did not act on their own initiative to shut down the pipeline once Piper Alpha\u0027s emergency was clearly evident",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM of the Tartan Platform did not initiate an independent shutdown of the export pipeline to Piper Alpha, despite the scale of the emergency being clearly visible. In the absence of a formal instruction and a cross-platform protocol, the OIM did not feel empowered to act unilaterally.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "bb5c063e-9ead-4e81-9bc8-bd4c89cd2ffc",
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  9270,
        "pos_y":  64,
        "width":  168,
        "height":  96
    },
    {
        "id":  null,
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "OIM — Claymore Platform did not act on their own initiative to shut down the pipeline once Piper Alpha\u0027s emergency was clearly evident",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The OIM of the Claymore Platform did not initiate an independent shutdown of the export pipeline to Piper Alpha, despite the scale of the emergency. The OIM later stated to the Cullen Inquiry that they had no permission from the Occidental control centre to shut down and so continued pumping.",
                               "influence_type":  "human",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "acfc6d10-8696-4d30-b401-822ff8fd2390"
                                                   ],
                               "factor_classification":  "contributing"
                           },
        "pos_x":  9270,
        "pos_y":  64,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e37e568c-4a48-43d3-b556-bf6a8d35d074",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Subsea Wellhead Shut-In By ROV",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Occidental - Subsea Operations",
                               "description":  "Subsea wellhead shut-in by ROV - Piper Alpha\u0027s subsea wellheads were shut in by remotely operated vehicles in the days following the disaster, cutting off the hydrocarbon supply feeding surface fires above the wreckage.",
                               "barrier_role":  "recovery",
                               "control_type":  "engineering",
                               "barrier_state":  "effective"
                           },
        "pos_x":  10866,
        "pos_y":  1448,
        "width":  216,
        "height":  144
    },
    {
        "id":  "e4256734-942e-4b1b-a615-20daa5c4fc3c",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Night Shift Assumes Control",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Control room",
                               "timestamp":  "1988-07-06T16:00",
                               "description":  "Night shift assumes control of the platform. No formal handover briefing is given regarding the open permit on PSV-504. Night shift personnel are unaware the blind flange is not rated to withstand operating pressure if Pump A is started."
                           },
        "pos_x":  1464,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "e6e0553c-fca5-4176-aee7-222df32030b0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Day Shift Maintenance Technician(s) removed PSV-504 and fitted an unrated blind flange to the open pipe spool on Pump A",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The day shift maintenance team physically removed PSV-504 from Condensate Pump A and fitted a temporary blind flange to the open pipe spool. The blind flange was not rated to withstand operating pressure. This action created the direct physical condition that caused the condensate release when Pump A was subsequently started.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  0,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e8435c81-fd60-4d04-99f0-f16a9337fe65",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Lead Production Operator (night shift) was not briefed by the outgoing production staff on the status of Pump A or the open PSV-504 permit",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The night shift Lead Production Operator received no briefing from outgoing day shift production staff on the status of Pump A or the existence of the open PSV-504 permit. He was unaware of the dangerous state of the pump when he later located the permit and sought authorisation to start it.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "30bc0683-49e4-46d5-8edf-2501a08469ee"
                                                   ],
                               "body_display_mode":  "description",
                               "factor_classification":  "essential"
                           },
        "pos_x":  2160,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "e94cefd5-809b-446f-9d4d-6c0dfc1ddce3",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_outcome",
        "heading":  "External Inquiry And Regulatory Reform",
        "color_hex":  "#EF4444",
        "created_by_user_id":  "420266a0-2087-4f36-8c28-340443dd1a82",
        "element_config":  {
                               "description":  "The incident was investigated and reported entirely by external authorities, resulting in a landmark public inquiry and wholesale reform of UK offshore safety regulation.",
                               "consequence_category":  "reporting",
                               "reporting_consequence":  "reported_to_regulator"
                           },
        "pos_x":  12780,
        "pos_y":  -872,
        "width":  216,
        "height":  216
    },
    {
        "id":  "eabffd7b-6875-47eb-9504-800ea3406ef7",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Conduct Forthwith Survivability Studies",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / HSE",
                               "action_type":  "corrective",
                               "description":  "A systematic analysis of the survivability of safety-critical systems, including emergency shutdown valves, fire pumps, deluge systems, the control room, public address system, emergency power, and lighting, must be conducted for all existing installations. These became known as \"forthwith studies\" in the Cullen Report."
                           },
        "pos_x":  7878,
        "pos_y":  3256,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f083f6ab-5bc9-41c3-af83-ca423f723007",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Support Vessels Respond",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Sea -- standby vessel positions",
                               "timestamp":  "1988-07-06T22:02",
                               "description":  "Support vessels Tharos and Silver Pit observe the explosion from their standby positions and begin moving toward the platform. Tharos initiates its emergency response and launches rescue craft.",
                               "body_display_mode":  "description"
                           },
        "pos_x":  5776,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "f1e9afaf-d048-4d5c-b9e6-d84ee6421488",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Pump A Start Witness Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — multiple witnesses, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "At approximately 21:56 Pump A was started. An immediate condensate release occurred through the open pipe spool. Witnesses described a sustained high-pitched screeching noise prior to the explosion, consistent with a high-pressure gas release.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363554456-09ce443b-e677-4fb0-b218-1dbb5538c9a8-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  2160,
        "pos_y":  1944,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f28d9ba2-aae5-421a-a7fe-8c91e1a9e123",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The blind flange fitted to the Pump A pipe spool was not rated to withstand condensate system operating pressure",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The temporary blind flange hand-fitted to the open pipe spool in place of PSV-504 was not rated for the operating pressure of the condensate system. When Pump A was started, the flange failed immediately, releasing high-pressure condensate that vaporised on the module deck and formed the explosive vapour cloud.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "people_involved":  [
                                                       "44820e39-3bce-4baa-b6d0-b63bd73221cd"
                                                   ],
                               "factor_classification":  "essential"
                           },
        "pos_x":  744,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "f2db7856-10bd-40a7-82f8-4f8e526dd3f0",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Assess Fire And Explosion Hazards",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators / platform designers",
                               "action_type":  "preventive",
                               "description":  "A systematic identification and assessment of fire and explosion hazards must be carried out for each installation, including analysis of smoke and gas ingress into the temporary safe refuge and structural survivability under fire and blast loads."
                           },
        "pos_x":  8610,
        "pos_y":  3000,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f3964303-2dfe-4d26-a8e9-b2a2d94ec61b",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_finding",
        "heading":  "Blind Flange Misinterpreted By Operator",
        "color_hex":  "#1d4ed8",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The night shift operator misinterpreted the blind flange as a sufficient seal and sought authorization to start Pump A without physically inspecting it.",
                               "confidence_level":  "high"
                           },
        "pos_x":  2160,
        "pos_y":  2520,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f4b57273-45c1-4491-904d-e7b313cdcbe2",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "person",
        "heading":  "MV Tharos Crew\nFirefighting and rescue support vessel crew",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "person_type":  "Responder"
                           },
        "pos_x":  5832,
        "pos_y":  744,
        "width":  240,
        "height":  120
    },
    {
        "id":  "f601afc2-bbe1-4446-b209-5771074cac70",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Search And Rescue Continues Overnight",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Sea -- around wreckage site",
                               "timestamp":  "1988-07-07T01:30",
                               "description":  "Search and rescue operations continue through the night. Coast Guard and military helicopters join the support vessels. 61 men are rescued alive. 167 men perish, including 2 rescuers from the Silver Pit."
                           },
        "pos_x":  11548,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "f7123be6-c29b-4789-b3d0-363a3d47b049",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "First Explosion Survivor Testimony",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Survivor testimony — multiple witnesses, Cullen Inquiry",
                               "media_mime":  "image/png",
                               "media_name":  "Public Inquiry.png",
                               "description":  "The first explosion occurred at approximately 22:00 in Module C. Men in the control room were knocked off their feet. Men off duty in the accommodation block were lifted from chairs or thrown from their beds. Multiple survivors gave consistent accounts of the initial blast.",
                               "evidence_type":  "statement",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "e9df9c19-104d-49b5-ada6-14875b46b528/1777363577796-264c6bc0-ee32-4488-98f5-a45b90f3162c-public-inquiry.png",
                               "show_canvas_preview":  true,
                               "incident_detail_open":  true
                           },
        "pos_x":  2880,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f7494f14-1df0-4f60-b168-60802127d5d4",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Accommodation Block Forensic Examination",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Grampian Police forensic examination — accommodation block recovery",
                               "media_mime":  "",
                               "media_name":  "",
                               "description":  "The accommodation block was recovered from the seabed in late 1988 and transported to Dott, where it was searched by Grampian Police, divers, and HSE personnel. The bodies of 87 men were found inside. Physical evidence from the block confirmed the structural failure mode and the cause of death of those who sheltered there.",
                               "evidence_type":  "record",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "",
                               "show_canvas_preview":  false
                           },
        "pos_x":  9786,
        "pos_y":  1624,
        "width":  216,
        "height":  144
    },
    {
        "id":  "f94f8639-a3bf-427a-b02a-ec9b2b9c850e",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "PSV-504 Permit Left In Control Room",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Control room",
                               "timestamp":  "1988-07-06T15:00",
                               "description":  "Maintenance work on PSV-504 is not completed before the end of day shift. A permit to work is raised and left in the control room noting the valve is removed and the pipe spool is temporarily blanked.",
                               "incident_detail_open":  false
                           },
        "pos_x":  748,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "fa8e2b85-9788-44de-9936-a60e0174b604",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_sequence_step",
        "heading":  "Fires Diminish And Inquiry Announced",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  {
                               "location":  "Wreckage site / onshore (London)",
                               "timestamp":  "",
                               "description":  "Fires above the collapsed platform structure begin to diminish as pipeline flows are shut off and fuel is exhausted. The UK government announces a public inquiry to be led by Lord Cullen."
                           },
        "pos_x":  12916,
        "pos_y":  960,
        "width":  220,
        "height":  120
    },
    {
        "id":  "fbd5a93f-4edb-40c6-bbb9-196c9f670dab",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Smoke penetrated the accommodation block rapidly, rendering it uninhabitable before external rescue could be mounted",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Following the second explosion, smoke penetrated the accommodation block rapidly and rendered it uninhabitable before any external rescue could be organised. Personnel who had mustered inside had no means of escape and were unable to survive the conditions.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  7362,
        "pos_y":  272,
        "width":  168,
        "height":  96
    },
    {
        "id":  "fc16746a-49fc-432e-bec9-9a2bb59e8b10",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_control_barrier",
        "heading":  "Pressure-Rated Isolation Blank",
        "color_hex":  "#4ade80",
        "created_by_user_id":  null,
        "element_config":  {
                               "owner_text":  "Maintenance Department",
                               "description":  "Pressure-rated isolation blank - the blind flange fitted to the open pipe spool in place of PSV-504 was not rated to withstand operating pressure. It failed immediately when Pump A was started.",
                               "barrier_role":  "preventive",
                               "control_type":  "engineering",
                               "barrier_state":  "failed"
                           },
        "pos_x":  0,
        "pos_y":  1392,
        "width":  216,
        "height":  144
    },
    {
        "id":  "fc2415a3-d8be-49d0-90c0-1cf2d64b9b94",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Occidental Petroleum Senior Management (onshore) had not required emergency drills that rehearsed a catastrophic multi-explosion whole-platform abandonment scenario",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No emergency drills had been conducted at Piper Alpha that rehearsed a catastrophic, multi-explosion, whole-platform fire scenario requiring full platform abandonment. Personnel and OIM had no practiced framework for the decisions and actions required by the scale of emergency that developed.",
                               "influence_type":  "organisational",
                               "factor_presence":  "absent",
                               "people_involved":  [
                                                       "b10b427f-a4fc-4fd5-9fb0-9480b89dd554"
                                                   ],
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  5784,
        "pos_y":  72,
        "width":  168,
        "height":  96
    },
    {
        "id":  "fcce9d7e-7c10-493b-ac33-6e09501cf7df",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_evidence",
        "heading":  "Pump A Permit Record",
        "color_hex":  "#cbd5e1",
        "created_by_user_id":  null,
        "element_config":  {
                               "source":  "Permit to work — Occidental Petroleum maintenance system",
                               "media_mime":  "",
                               "media_name":  "",
                               "description":  "Pump A was electrically and mechanically isolated during the day shift but the PSV-504 was removed and an unused blind flange hand-tightened onto the open pipe spool. This physical state was documented by the day shift maintenance team on the permit.",
                               "evidence_type":  "record",
                               "media_rotation_deg":  0,
                               "media_storage_path":  "",
                               "show_canvas_preview":  false
                           },
        "pos_x":  744,
        "pos_y":  1608,
        "width":  216,
        "height":  144
    },
    {
        "id":  "fe024495-3864-494b-9ca4-59cafac2ab44",
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_recommendation",
        "heading":  "Lock Off And Tag Isolated Equipment",
        "color_hex":  "#14b8a6",
        "created_by_user_id":  null,
        "element_config":  {
                               "due_date":  "",
                               "owner_text":  "Offshore operators",
                               "action_type":  "corrective",
                               "description":  "All permit to work systems must include a procedure for the physical locking off and tagging of isolation valves and equipment, so that the safe state of equipment is communicated at the equipment itself and not solely through paper records in the control room."
                           },
        "pos_x":  2160,
        "pos_y":  2736,
        "width":  216,
        "height":  144
    }
]
$canvas_element_factors_import$::jsonb;
begin
  with src as (
    select *
    from jsonb_to_recordset(import_rows) as x(
      id text,
      map_id text,
      element_type text,
      heading text,
      color_hex text,
      created_by_user_id text,
      element_config jsonb,
      pos_x numeric,
      pos_y numeric,
      width numeric,
      height numeric
    )
  )
  select count(*)
  into missing_existing_count
  from src
  left join ms.canvas_elements existing
    on existing.id = src.id::uuid
   and existing.map_id = src.map_id::uuid
  where src.id is not null
    and existing.id is null;

  if missing_existing_count > 0 then
    raise exception 'CSV import references % existing canvas element IDs that were not found for the supplied map_id.', missing_existing_count;
  end if;

  with src as (
    select *
    from jsonb_to_recordset(import_rows) as x(
      id text,
      map_id text,
      element_type text,
      heading text,
      color_hex text,
      created_by_user_id text,
      element_config jsonb,
      pos_x numeric,
      pos_y numeric,
      width numeric,
      height numeric
    )
  )
  update ms.canvas_elements as target
  set
    element_type = src.element_type,
    heading = src.heading,
    color_hex = src.color_hex,
    element_config = src.element_config,
    pos_x = src.pos_x,
    pos_y = src.pos_y,
    width = src.width,
    height = src.height,
    updated_at = now()
  from src
  where src.id is not null
    and target.id = src.id::uuid
    and target.map_id = src.map_id::uuid;

  with src as (
    select *
    from jsonb_to_recordset(import_rows) as x(
      id text,
      map_id text,
      element_type text,
      heading text,
      color_hex text,
      created_by_user_id text,
      element_config jsonb,
      pos_x numeric,
      pos_y numeric,
      width numeric,
      height numeric
    )
  )
  insert into ms.canvas_elements (
    map_id,
    element_type,
    heading,
    color_hex,
    created_by_user_id,
    element_config,
    pos_x,
    pos_y,
    width,
    height
  )
  select
    src.map_id::uuid,
    src.element_type,
    src.heading,
    src.color_hex,
    src.created_by_user_id::uuid,
    src.element_config,
    src.pos_x,
    src.pos_y,
    src.width,
    src.height
  from src
  where src.id is null
    and not exists (
      select 1
      from ms.canvas_elements existing
      where existing.map_id = src.map_id::uuid
        and existing.element_type = src.element_type
        and existing.heading = src.heading
        and existing.element_config is not distinct from src.element_config
    );
end $$;
