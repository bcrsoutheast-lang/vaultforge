const ROLLOUT_STATES = ['Georgia', 'Tennessee', 'Florida'];

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
  return [];
}

function normalizeToken(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

function includesValue(arr, val) {
  const vals = toArray(arr).map(normalizeToken);
  return vals.includes(normalizeToken(val));
}

function overlaps(a, b) {
  const aVals = toArray(a).map(normalizeToken);
  const bVals = toArray(b).map(normalizeToken);
  return aVals.some(v => bVals.includes(v));
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getDetails(project) {
  if (!project || typeof project.details_json !== 'object' || project.details_json === null) {
    return {};
  }
  return project.details_json;
}

function priceFits(price, min, max) {
  const p = toNumber(price);
  const minVal = toNumber(min);
  const maxVal = toNumber(max);

  if (p === null) return false;
  if (minVal !== null && p < minVal) return false;
  if (maxVal !== null && p > maxVal) return false;

  return true;
}

function qualifies(project, pref) {
  if (!ROLLOUT_STATES.includes(project.state)) return false;
  if (!includesValue(pref.target_states, project.state)) return false;
  if (!includesValue(pref.property_types, project.property_type)) return false;
  if (!overlaps(pref.strategies, [project.strategy])) return false;
  if (!priceFits(project.price, pref.min_price, pref.max_price)) return false;

  return true;
}

function score(project, pref) {
  let total = 70;

  if (project.distress === true && pref.distress === true) {
    total += 15;
  }

  if (pref.notify_enabled === true) {
    total += 5;
  }

  const details = getDetails(project);

  if (project.property_type === 'Residential') {
    if (details.bedrooms) total += 2;
    if (details.bathrooms) total += 2;
    if (details.sqft) total += 3;
    if (details.arv) total += 4;
  }

  if (project.property_type === 'Commercial') {
    if (details.asset_type) total += 4;
    if (details.units) total += 3;
    if (details.noi) total += 5;
    if (details.cap_rate) total += 2;
  }

  if (project.property_type === 'Land') {
    if (details.acres) total += 4;
    if (details.zoning) total += 3;
    if (details.buildable_lots) total += 4;
    if (details.entitled) total += 2;
  }

  if (total > 100) total = 100;

  return total;
}

function reasons(project, pref) {
  const out = [];

  out.push(`Targets ${project.state}`);
  out.push(`Matches ${project.property_type}`);
  out.push(`Strategy includes ${project.strategy}`);
  out.push('Price fits range');

  if (project.distress === true && pref.distress === true) {
    out.push('Distress matched');
  }

  if (pref.notify_enabled === true) {
    out.push('Notifications enabled');
  }

  return out;
}

export async function runPainMatcher(supabase, painProjectId) {
  const { data: project, error: projectError } = await supabase
    .from('pain_projects')
    .select('*')
    .eq('id', painProjectId)
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error('Pain project not found');

  const { data: prefs, error: prefError } = await supabase
    .from('member_match_preferences')
    .select('*');

  if (prefError) throw prefError;

  const rows = [];

  for (const pref of prefs || []) {
    if (!qualifies(project, pref)) continue;

    rows.push({
      pain_project_id: project.id,
      user_id: pref.user_id,
      match_score: score(project, pref),
      match_reasons: reasons(project, pref),
      status: 'new'
    });
  }

  await supabase
    .from('pain_matches')
    .delete()
    .eq('pain_project_id', project.id);

  if (!rows.length) {
    return {
      success: true,
      matchesCreated: 0
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('pain_matches')
    .insert(rows)
    .select();

  if (insertError) throw insertError;

  return {
    success: true,
    matchesCreated: inserted.length
  };
}
