-- Intentionally seeds only canvas_elements. CSV related_item_* columns are ignored; no map links are created.
do $$
declare
  seed_rows jsonb := $piper_alpha_factor_nodes$
[
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "PSV-504 was physically removed from Condensate Pump A leaving the pipe spool open during day shift maintenance",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "PSV-504 was physically removed from Condensate Pump A during routine day shift maintenance and was not reinstated before the shift ended. Its removal left the pipe spool open to full condensate system pressure if the pump were ever started, creating the direct physical condition for the subsequent release.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15120,
        "pos_y":  -864,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Condensate Pump A was left isolated in a dangerous unrestored state at the end of day shift with no physical indicator at the equipment",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Condensate Pump A was left in a dangerous intermediate isolated state at the end of day shift — PSV-504 absent, pipe spool open, and only an unrated blind flange in place. No physical lockout, tag, or warning existed at the pump itself to indicate this dangerous condition to anyone approaching it during the night shift.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15360,
        "pos_y":  -864,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Condensate Pump A was started while PSV-504 was absent and only an unrated blind flange was fitted to the open pipe spool",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Condensate Pump A was started by the night shift while PSV-504 remained absent and the open pipe spool was fitted with only an unrated blind flange. The moment the pump started, high-pressure condensate escaped through the open spool, vaporised on the module deck, and formed the explosive vapour cloud that caused the first explosion.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15600,
        "pos_y":  -864,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Condensate Pump B tripped and could not be restarted, creating the immediate operational pressure that led to the decision to start Pump A",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The trip of Condensate Pump B and its failure to restart created an immediate production shortfall that placed the night shift under pressure to find an alternative. This operational urgency was the direct trigger for the sequence of decisions that led to the start of Pump A while it was in a dangerous isolated state.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15840,
        "pos_y":  -864,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The open pipe spool on Pump A was left with only an unrated blind flange after PSV-504 was removed and was not reinstated before the shift ended",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "When PSV-504 was removed from Pump A, the open pipe spool was fitted with a temporary unrated blind flange and left in that state at shift end. The pipe spool represented an uncontrolled opening in the condensate pressure system. If pressure was applied — as happened when Pump A was started — the flange would fail and condensate would escape directly onto the module deck.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15120,
        "pos_y":  -720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The blind flange fitted to the open pipe spool was not rated to withstand condensate system operating pressure and failed immediately when Pump A was started",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The temporary blind flange hand-fitted to the pipe spool in place of PSV-504 was not rated for the operating pressure of the condensate system. It was a temporary cover, not a pressure containment device. When Pump A was started, the flange failed immediately, releasing high-pressure condensate that flashed to vapour on the module deck and ignited.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15360,
        "pos_y":  -720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The firewater deluge system was in manual mode and was not activated at any point during the emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s automatic firewater deluge system had been placed in manual mode earlier in the day due to diving operations below the platform. It was never returned to automatic mode and was not activated at any point during the emergency — either automatically or manually. Its absence removed the primary fire suppression capability at the moment it was most needed.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15600,
        "pos_y":  -720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The first explosion disabled significant portions of the deluge pipework, rendering manual activation partially ineffective even if attempted",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The first explosion physically damaged significant portions of the deluge pipework and pumping infrastructure. Even if manual activation had been attempted after the initial blast, the system\u0027s capacity to deliver suppression water to the affected modules would have been substantially compromised.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15840,
        "pos_y":  -720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The Tartan gas riser was subjected to sustained uncontrolled jet fire without suppression until it failed catastrophically, causing the second and most lethal explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "With the deluge system inactive and no pipeline shutdown instruction issued to the Tartan platform, the Tartan gas export pipeline riser was exposed to sustained uncontrolled jet fire for nearly an hour. It heated progressively until it failed catastrophically at approximately 22:50, releasing gas at an estimated 15–30 tonnes per second and causing the second explosion — the primary cause of mass casualties.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15120,
        "pos_y":  -576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The Claymore pipeline riser failed under sustained fire, producing a third explosion that accelerated the final structural collapse of the platform",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "With the Claymore platform still pumping live hydrocarbons through its connected pipeline, the Claymore riser was also subjected to sustained fire and eventually failed. The resulting third explosion accelerated the progressive structural collapse of the central platform sections into the sea.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15360,
        "pos_y":  -576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The module firewall panels between Module C and adjacent process areas were not rated to withstand a vapour cloud explosion and failed on the first blast",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The firewall panels separating Module C from adjacent process modules were not designed or rated to withstand a vapour cloud explosion of the magnitude that occurred. They failed on the first blast, allowing fire to spread immediately into adjacent modules and physically damaging portions of the deluge system pipework in the process.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15600,
        "pos_y":  -576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The accommodation block was not designed to withstand blast and thermal loading from a major gas riser explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The accommodation block was structurally inadequate to protect personnel against the blast and thermal loading of a major gas riser explosion. It was physically compromised by the second explosion and subsequently collapsed into the sea, with 87 men inside who had mustered there as directed by standing emergency procedures.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15840,
        "pos_y":  -576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The accommodation block did not have a secondary protected escape route to sea level once the primary muster area became untenable",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Once the accommodation block became uninhabitable due to structural damage and smoke penetration, no protected secondary escape route to sea level existed from within it. Personnel who had mustered there as instructed had no means of reaching the sea other than by traversing burning and structurally compromised deck areas.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15120,
        "pos_y":  -432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The public address system was destroyed by the first explosion, eliminating the primary means of communicating an evacuation order across the platform",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s public address and internal communications system was physically destroyed by the first explosion. This eliminated the primary means of issuing emergency instructions to personnel across the platform, including any abandon platform order, even if one had been authorised by the OIM.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15360,
        "pos_y":  -432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No independent or redundant emergency communications system existed on the platform to function if the PA system was destroyed",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform had no backup or redundant emergency communications capability independent of the main public address system. When the PA system was destroyed by the first explosion, no alternative means existed for the OIM or any other person to issue instructions to personnel across the platform.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  -432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The lifeboats and lifeboat stations were inaccessible due to fire and smoke, preventing their use as the primary planned evacuation route",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The platform\u0027s primary enclosed lifeboats and lifeboat stations were rendered inaccessible by fire and smoke from the initial explosion. This eliminated the primary planned evacuation route before any organised evacuation was attempted, leaving workers with no conventional means of leaving the platform safely.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15840,
        "pos_y":  -432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Immersion suits were not accessible to workers trapped in the accommodation block before conditions became unsurvivable",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Personal survival suits and immersion suits were not readily accessible to personnel inside the accommodation block before conditions became unsurvivable. Workers who escaped into the water did so without thermal protection, relying on the speed of the Silver Pit rescue craft to survive exposure in the North Sea.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15120,
        "pos_y":  -288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No automated emergency isolation valves were fitted to the Tartan or Claymore pipeline risers capable of closing under fire or remote command",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No remotely or automatically actuated isolation valves were installed on the Tartan or Claymore pipeline risers at Piper Alpha. Cutting off the hydrocarbon supply to the riser fires therefore required active decisions and successful communications across multiple platforms — a process that failed entirely during the emergency.",
                               "influence_type":  "equipment",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15360,
        "pos_y":  -288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The MV Tharos water cannon capacity was insufficient to suppress the jet fire at the gas riser and the vessel was forced to withdraw before the second explosion",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The MV Tharos firefighting vessel\u0027s water monitor cannons were overwhelmed by the scale of the jet fire produced by the burning Tartan gas riser. The vessel was forced to withdraw due to heat intensity and falling structural debris before the second explosion, removing the only active external firefighting resource at the riser area.",
                               "influence_type":  "equipment",
                               "factor_presence":  "present",
                               "factor_classification":  "neutral"
                           },
        "pos_x":  15600,
        "pos_y":  -288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Night-time operations reduced situational awareness and increased cognitive load for all on-duty decision-makers at the critical moment Pump A start was authorised",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Night-time operations placed the entire on-duty team — including the Lead Production Operator and the Night Shift OIM — in a decision-making environment of reduced manning, reduced visibility, and increased cognitive load. These conditions predisposed both individuals to faster, less rigorous decision-making at the moment the Pump A start was being considered and authorised.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15840,
        "pos_y":  -288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Calm sea conditions on the night of 6 July 1988 aided the recovery of survivors from the water by Silver Pit and Tharos rescue craft",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The relatively calm sea conditions in the North Sea on the night of 6 July 1988 were a neutral environmental factor that aided the recovery of survivors from the water. Had conditions been rougher, the rescue craft from Silver Pit and Tharos would have faced greater difficulty recovering persons from the sea, and the survival rate among those who jumped may have been lower.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "neutral"
                           },
        "pos_x":  15120,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Module C was positioned in close proximity to adjacent process modules, meaning the initial explosion immediately compromised adjacent areas and safety systems",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The condensate injection module (Module C) was positioned in close proximity to adjacent process modules on the platform. This work area layout meant that the first explosion immediately compromised adjacent areas, failed the firewall panels, and disabled portions of the deluge system — accelerating the escalation of the incident beyond what a more isolated layout might have permitted.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "neutral"
                           },
        "pos_x":  15360,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The accommodation block was physically connected to and immediately adjacent to the main process deck, placing the primary muster area inside the fire escalation path",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The accommodation block was positioned directly adjacent to the main process deck rather than being separated or located at a safe distance. This work area layout meant that once the fire escalated to the riser area, the primary place of shelter directed workers into the path of the catastrophic explosion rather than away from it.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15600,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Dense black smoke rapidly penetrated the accommodation block, rendering it uninhabitable before any external rescue could be mounted",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Following the second explosion, dense black smoke from the burning hydrocarbons penetrated the accommodation block rapidly and rendered it uninhabitable before any external rescue could be organised or mounted. Personnel who had mustered inside had no means of escape and were unable to survive the conditions created by the smoke ingress.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15840,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Tharos and Silver Pit were on station within close proximity of the platform, enabling an immediate response and recovery of all 61 survivors who reached the water",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The standby positions of Tharos and Silver Pit in close proximity to the platform meant both vessels were able to respond immediately to the emergency. Their presence on station was the decisive factor in the recovery of all 61 survivors from the water. Had they been further away or not on station, the survivor count would almost certainly have been lower.",
                               "influence_type":  "environment",
                               "factor_presence":  "present",
                               "factor_classification":  "neutral"
                           },
        "pos_x":  15120,
        "pos_y":  0,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The permit to work system relied solely on a paper record in the control room and did not require physical tags or locks at the isolated equipment",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The permit to work system used on Piper Alpha communicated the isolation state of safety-critical equipment solely through a paper permit stored in the control room. No physical tag, lock, or visual indicator was required at the equipment itself. This meant a person could approach and start isolated equipment without encountering any on-site warning of its dangerous state.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15360,
        "pos_y":  0,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The permit to work system did not require an independent second-person sign-off before a permit could be acted upon",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The permit to work system did not require an independent second person to verify the physical state of safety-critical equipment before a permit was acted upon. A single person\u0027s interpretation of the paper permit in the control room was sufficient to seek authorisation to start isolated equipment, with no check on whether that interpretation was correct.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  0,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No systematic audit of permit to work compliance had been conducted to identify weaknesses in the system prior to the incident",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No systematic audit or review of permit to work compliance had been conducted at Piper Alpha prior to the incident. The fundamental weaknesses in the system — including the absence of physical lockout requirements, the absence of formal handover requirements for open permits, and the potential for permit misinterpretation — had never been identified or acted upon.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15840,
        "pos_y":  0,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The shift handover procedure did not require a formal verbal briefing between outgoing and incoming OIMs covering outstanding permits and maintenance",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The shift handover procedure on Piper Alpha did not require a formal structured verbal briefing between the outgoing and incoming OIMs covering outstanding maintenance work and open permits. This absence meant the dangerous state of Pump A was never communicated at shift change, leaving the night shift OIM to take command without knowledge of the outstanding hazard.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15120,
        "pos_y":  144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No written handover log or formal checklist was required to be completed and signed at OIM shift change",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No formal requirement existed for the outgoing OIM to complete and sign a written handover log at shift change covering outstanding permits, equipment isolation states, and operational hazards. The adequacy of shift handover was left entirely to individual practice, with no structured mechanism to ensure critical information was transferred between shifts.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15360,
        "pos_y":  144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No procedure required safety-critical equipment to be completed or reinstated to a safe defined state before handing over to the next shift",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No procedural rule required maintenance work on safety-critical equipment to be completed, or the equipment reinstated to a clearly documented safe state, before a shift could be handed over. This allowed Pump A to remain in a dangerous intermediate isolation state across a shift boundary without any formal control or escalation requirement.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The equipment isolation procedure did not require physical lockout or tagout to be applied at the equipment itself",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The equipment isolation and reinstatement procedure did not require the physical application of a lockout device or warning tag at the equipment being isolated. Isolation was communicated solely through the paper permit in the control room, meaning there was nothing at Pump A itself to prevent the night shift from starting it without first checking the permit system.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15840,
        "pos_y":  144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No requirement existed for the OIM to seek a second opinion or consult engineering before authorising the start of equipment under an active permit",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The equipment start authorisation procedure did not require the OIM to seek a second opinion or consult the relevant maintenance engineer before authorising the start of equipment that was subject to an active permit to work. A single verbal authorisation from the OIM — based solely on the operator\u0027s interpretation of the permit — was sufficient to proceed.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15120,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No procedure required the firewater deluge system to be returned to automatic mode after diving operations concluded or its manual status flagged at handover",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The firewater deluge system operating procedure did not require the system to be returned to automatic mode when diving operations concluded, nor did it require the manual status of the system to be formally flagged at shift handover. This allowed the deluge to remain in manual mode indefinitely without challenge, and meant its unavailability was unknown to the night shift when the emergency developed.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15360,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The emergency command procedure did not define criteria or trigger thresholds for when the OIM was required to issue an abandon platform order",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The emergency command and abandon platform procedure did not define clear criteria, conditions, or trigger thresholds under which the OIM was required to issue an abandon platform order. This left the abandon decision entirely to individual judgement in conditions of rapidly degrading communications, situational awareness, and structural integrity.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15600,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No designated deputy or command succession plan existed to assume emergency command if the OIM became incapacitated",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The emergency command procedure did not designate a deputy or define a command succession plan to assume emergency control of the platform if the OIM became incapacitated or lost situational awareness. When Colin Seaton effectively lost command capability after the first explosion, no one was designated to take over the emergency command function.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15840,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The emergency muster procedure directed all personnel to the accommodation block — a protocol designed for contained fires and wholly inadequate for a catastrophic platform-wide emergency",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The emergency muster and evacuation procedure directed all platform personnel to assemble in the accommodation block regardless of the nature or scale of the emergency. The procedure was designed for a contained fire scenario and had never been reviewed against a major accident scenario. In the conditions that developed, it directed workers into the path of catastrophic escalation.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15120,
        "pos_y":  432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The emergency muster procedure did not identify sea self-evacuation as a recognised or trained last-resort option for personnel",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The emergency muster and evacuation procedure made no provision for sea self-evacuation as a recognised or trained last-resort option for platform personnel. Workers had no procedural framework for the decision to jump from the platform into the sea. Those who survived did so by acting against their training and on individual instinct — not because the procedure supported that choice.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15360,
        "pos_y":  432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No emergency drill had rehearsed a catastrophic multi-explosion whole-platform abandonment scenario requiring full sea evacuation",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No emergency drill had ever been conducted at Piper Alpha that rehearsed a catastrophic, multi-explosion, whole-platform fire scenario requiring full platform abandonment and sea evacuation. Neither the OIM nor the platform workforce had a practiced framework for the decisions and actions required by the scale of the emergency that developed on 6 July 1988.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No cross-platform emergency shutdown procedure existed that would require or enable neighbouring platform OIMs to isolate their pipelines in a major incident on Piper Alpha",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No cross-platform emergency shutdown procedure existed that would automatically require or formally enable the OIMs of Tartan and Claymore to isolate their export pipelines in the event of a major incident on Piper Alpha. In the absence of such a procedure, both OIMs continued pumping after the first explosion because they had no instruction and no authority to act unilaterally.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "essential"
                           },
        "pos_x":  15840,
        "pos_y":  432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No dedicated emergency communications link existed between Piper Alpha and the OIMs of connected neighbouring platforms to enable rapid coordinated shutdown",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No dedicated emergency communications link or hotline existed between Piper Alpha\u0027s control room and the OIMs of the Tartan and Claymore platforms. Rapid coordination for an emergency pipeline shutdown was therefore dependent on the general radio network — a network that was compromised by the developing emergency itself and through which no shutdown instruction was ever successfully issued.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "contributing"
                           },
        "pos_x":  15120,
        "pos_y":  576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The safety management system did not require formal safety cases or systematic major hazard risk assessments for platform operations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system did not require the production of formal safety cases or the conduct of systematic major hazard risk assessments for Piper Alpha\u0027s operations. Without these, the major accident risks of the platform — including the condensate injection system configuration and the connected gas risers — were never formally evaluated or documented.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15360,
        "pos_y":  576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The safety management system did not require periodic review of emergency response procedures against major accident scenarios",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The safety management system did not require periodic audits or reviews of emergency response procedures to verify they were adequate for major accident scenarios. The accommodation block muster protocol was never tested against a catastrophic emergency scenario and remained in place unreviewed until it directly contributed to mass casualties.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "The safety management system applied equally to contractors and direct employees with no additional oversight or assurance of integration into emergency procedures",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "Occidental\u0027s safety management system was applied equally to contractors and direct employees without any additional oversight, verification, or assurance mechanisms to confirm that contractors were fully integrated into emergency procedures. The systemic safety failures in the SMS were therefore not mitigated by any contractor-specific controls.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15840,
        "pos_y":  576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "UK offshore safety regulation was prescriptive rather than goal-setting, requiring rule compliance rather than demonstrated control of major hazards",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "UK offshore safety regulation required operators to comply with specific prescriptive rules rather than to demonstrate systematic identification and control of major hazards. This meant that fundamental failures in Occidental\u0027s safety management system were not identified or enforced against, because they did not necessarily violate a specific prescriptive rule.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15120,
        "pos_y":  720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "Regulatory oversight of offshore safety sat within a department also mandated to maximise oil production, creating a structural conflict of interest",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "The Department of Energy held responsibility for both offshore safety regulation and the promotion of maximum UK oil production. This structural conflict of interest weakened safety enforcement across the UK offshore industry, as the same department had competing incentives between enforcing costly safety improvements and maximising production output.",
                               "influence_type":  "process",
                               "factor_presence":  "present",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15360,
        "pos_y":  720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No industry-wide standard existed requiring joint emergency plans or cross-platform shutdown protocols for operators of interconnected offshore installations",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No regulatory or industry-wide standard existed requiring operators of interconnected offshore installations to maintain joint emergency response plans or cross-platform pipeline shutdown protocols. This absence was a systemic gap across the entire UK offshore industry, not specific to Occidental, and was identified by Lord Cullen as requiring regulatory remedy.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15600,
        "pos_y":  720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No formal design review or hazard assessment was conducted when gas compression and condensate injection were added to the platform in 1978",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "When gas compression and condensate injection were added to Piper Alpha in 1978, no formal design review or major hazard assessment was commissioned to evaluate the impact on the platform\u0027s risk profile. The platform was operated with a significantly higher hazard profile than its original design accounted for, and no compensating safety measures were introduced.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15840,
        "pos_y":  720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "incident_factor",
        "heading":  "No formal quantitative risk assessment of the condensate system and riser configuration had been conducted at any point in the platform\u0027s operating life",
        "color_hex":  "#fde047",
        "created_by_user_id":  null,
        "element_config":  {
                               "description":  "No formal quantitative or qualitative major hazard risk assessment of the condensate injection system and the connected gas riser configuration had been conducted at any point in Piper Alpha\u0027s operating life. Had such an assessment been carried out, the absence of automated riser isolation valves, the deluge manual-mode practice, and the accommodation block proximity to the riser area would likely have been identified as unacceptable risks.",
                               "influence_type":  "process",
                               "factor_presence":  "absent",
                               "factor_classification":  "predisposing"
                           },
        "pos_x":  15120,
        "pos_y":  864,
        "width":  168,
        "height":  96
    }
]
$piper_alpha_factor_nodes$::jsonb;
begin
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
  from jsonb_to_recordset(seed_rows) as src(
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
  where btrim(src.heading) <> ''
    and src.element_type = 'incident_factor'
    and not exists (
      select 1
      from ms.canvas_elements existing
      where existing.map_id = src.map_id::uuid
        and existing.element_type = src.element_type
        and existing.heading = src.heading
    );
end $$;