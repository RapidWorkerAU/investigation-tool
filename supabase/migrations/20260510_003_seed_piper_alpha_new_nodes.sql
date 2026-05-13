do $$
declare
  seed_rows jsonb := $piper_alpha_new_nodes$
[
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Safety relief valve\nPSV-504 — Condensate Pump A",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  -864,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pump / rotating equipment\nCondensate Pump A — Module C",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  -672,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pump / rotating equipment\nCondensate Pump B — Module C",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  -480,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pipe spool / pressure containment\nOpen pipe spool — Pump A condensate line",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  -288,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Temporary isolation fitting\nUnrated blind flange — Pump A pipe spool",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  -96,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Fire suppression system\nFirewater deluge system — Piper Alpha",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  96,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pipeline riser\nTartan gas export pipeline riser — Piper Alpha north-east riser bay",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  288,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pipeline riser\nClaymore oil export pipeline riser — Piper Alpha central riser bay",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  480,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Blast / fire separation\nModule firewall panels — Module C / Module B boundary",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  672,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Accommodation structure\nAccommodation block — Piper Alpha",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  864,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Emergency communication system\nPublic address / intercom system — Piper Alpha",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  1056,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Life-saving appliance\nLifeboats and lifeboat stations — Piper Alpha",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  1248,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Personal protective equipment\nImmersion / survival suits — platform general issue",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  1440,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Pipeline isolation valve\nEmergency riser isolation valves — Tartan and Claymore risers (absent)",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  1632,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "equipment",
        "heading":  "Firefighting vessel\nMV Tharos — firefighting and rescue support vessel",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  13680,
        "pos_y":  1824,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "Night-time operations — reduced lighting; reduced manning; increased cognitive load on duty team\nTime of Day",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  -864,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "North Sea sea conditions on the night of 6 July 1988 — calm; low swell\nWeather",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  -672,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "Module C condensate injection area — positioned in close proximity to adjacent process modules\nWork Area Layout",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  -480,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "Accommodation block — physically connected to and immediately adjacent to the main process deck\nWork Area Layout",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  -288,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "Dense black smoke from burning hydrocarbons — rapidly penetrated accommodation block interior\nAir Quality",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  -96,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "environment",
        "heading":  "Standby vessel positions — Tharos and Silver Pit on station within close proximity of the platform\nOther",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14160,
        "pos_y":  96,
        "width":  96,
        "height":  144
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Permit to work system",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -864,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Shift handover procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -720,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Equipment isolation and reinstatement procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -576,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Equipment start authorisation procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Firewater deluge system operating procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Emergency command and abandon platform procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  -144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Emergency muster and evacuation procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  0,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Cross-platform emergency shutdown procedure",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  144,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Safety management system",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  288,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Offshore safety regulatory framework",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  432,
        "width":  168,
        "height":  96
    },
    {
        "map_id":  "e9df9c19-104d-49b5-ada6-14875b46b528",
        "element_type":  "process_component",
        "heading":  "Platform design and modification review process",
        "color_hex":  null,
        "created_by_user_id":  null,
        "element_config":  null,
        "pos_x":  14640,
        "pos_y":  576,
        "width":  168,
        "height":  96
    }
]
$piper_alpha_new_nodes$::jsonb;
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
    and not exists (
      select 1
      from ms.canvas_elements existing
      where existing.map_id = src.map_id::uuid
        and existing.element_type = src.element_type
        and existing.heading = src.heading
    );
end $$;
