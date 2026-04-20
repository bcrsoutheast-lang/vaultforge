const ROLLOUT_STATES = ['Georgia', 'Tennessee', 'Florida'];

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
  return [];
}

function includesValue(arr, val) {
  return toArray(arr).includes(val);
}

function overlaps(a, b) {
  const bVals = toArray(b);
  return toArray(a).some(v => bVals.includes(v));
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

function textHasAny(haystack, needles) {
  const text = normalizeText(haystack);
  return needles.some(n => text.includes(normalizeText(n)));
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

function scoreResidential(details, pref) {
  let total = 0;
  const prefText = JSON.stringify(pref || {}).toLowerCase();

  const bedrooms = toNumber(details.bedrooms);
  const bathrooms = toNumber(details.bathrooms);
  const sqft = toNumber(details.sqft);
  const arv = toNumber(details.arv);

  if (bedrooms !== null) total += 2;
  if (bathrooms !== null) total += 2;
  if (sqft !== null) total += 3;
  if (arv !== null) total += 4;

  if (textHasAny(prefText, ['fix and flip', 'flip', 'rehab']) && arv !== null) total += 5;
  if (textHasAny(prefText, ['rental', 'buy and hold', 'brrrr']) && bedrooms !== null && bedrooms >= 2) total += 4;
  if (sqft !== null && sqft >= 1200) total += 2;

  return total;
}

function scoreCommercial(details, pref) {
  let total = 0;
  const prefText = JSON.stringify(pref || {}).toLowerCase();

  const assetType = normalizeText(details.asset_type);
  const units = toNumber(details.units);
  const sqft = toNumber(details.sqft);
  const noi = toNumber(details.noi);
  const capRateText = normalizeText(details.cap_rate);

  if (assetType) total += 4;
  if (units !== null) total += 3;
  if (sqft !== null) total += 2;
  if (noi !== null) total += 5;
  if (capRateText) total += 2;

  if (assetType && textHasAny(prefText, [assetType])) total += 6;
  if (noi !== null && noi > 0) total += 4;
  if (units !== null && units >= 5) total += 2;

  return total;
}

function scoreLand(details, pref) {
  let total = 0;
  const prefText = JSON.stringify(pref || {}).toLowerCase();

  const acres = toNumber(details.acres);
  const zoning = normalizeText(details.zoning);
  const buildableLots = toNumber(details.buildable_lots);
  const entitled = normalizeText(details.entitled);

  if (acres !== null) total += 4;
  if (zoning) total += 3;
  if (buildableLots !== null) total += 4;
  if (entitled) total += 2;

  if (textHasAny(prefText, ['development', 'land']) && acres !== null) total += 5;
  if (buildableLots !== null && buildableLots > 0) total += 4;
  if (entitled === 'yes' || entitled === 'partial') total += 3;

  return total;
}

function structuredScore(project, pref) {
  const details = getDetails(project);

  if (project.property_type === 'Residential') {
    return scoreResidential(details, pref);
  }

  if (project.property_type === 'Commercial') {
    return scoreCommercial(details, pref);
  }

  if (project.property_type === 'Land') {
    return scoreLand(details, pref);
  }

  return 0;
}

function score(project, pref) {
  let total = 70;

  if (project.distress === true && pref.distress === true) {
    total += 15;
  }

  if (pref.notify_enabled === true) {
    total += 5;
  }

  total += structuredScore(project, pref);

  if (total > 100) total = 100;
  return total;
}

function structuredReasons(project) {
  const details = getDetails(project);
  const out = [];

  if (project.property_type === 'Residential') {
    if (details.bedrooms != null) out.push(`Bedrooms: ${details.bedrooms}`);
    if (details.bathrooms != null) out.push(`Bathrooms: ${details.bathrooms}`);
    if (details.sqft != null) out.push(`Sq Ft: ${details.sqft}`);
    if (details.arv != null) out.push(`ARV: ${details.arv}`);
  }

  if (project.property_type === 'Commercial') {
    if (details.asset_type) out.push(`Asset type: ${details.asset_type}`);
    if (details.units != null) out.push(`Units: ${details.units}`);
    if (details.noi != null) out.push(`NOI: ${details.noi}`);
    if (details.cap_rate) out.push(`Cap rate: ${details.cap_rate}`);
  }

  if (project.property_type === 'Land') {
    if (details.acres != null) out.push(`Acres: ${details.acres}`);
    if (details.zoning) out.push(`Zoning: ${details.zoning}`);
    if (details.buildable_lots != null) out.push(`Buildable lots: ${details.buildable_lots}`);
    if (details.entitled) out.push(`Entitled: ${details.entitled}`);
  }

  return out;
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

  out.push(...structuredReasons(project));

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
