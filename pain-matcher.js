const ROLLOUT_STATES = ['Georgia', 'Tennessee', 'Florida'];

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function arrayIncludes(list, value) {
  return toArray(list).includes(String(value || '').trim());
}

function arraysOverlap(a, b) {
  const bSet = new Set(toArray(b));
  return toArray(a).some(item => bSet.has(item));
}

function priceFits(projectPrice, minPrice, maxPrice) {
  const price = toNumber(projectPrice);
  const min = toNumber(minPrice);
  const max = toNumber(maxPrice);

  if (price === null) return false;
  if (min !== null && price < min) return false;
  if (max !== null && price > max) return false;

  return true;
}

function buildReasons(project, pref) {
  const reasons = [];

  reasons.push(`Targets ${project.state}`);
  reasons.push(`Matches ${project.property_type}`);
  reasons.push(`Strategy includes ${project.strategy}`);
  reasons.push('Price fits member range');

  if (pref.distress === true && project.distress === true) {
    reasons.push('Distress preference matched');
  }

  if (pref.notify_enabled === true) {
    reasons.push('Notifications enabled');
  }

  return reasons;
}

function computeScore(project, pref) {
  let score = 70;

  if (pref.distress === true && project.distress === true) {
    score += 15;
  }

  if (pref.notify_enabled === true) {
    score += 5;
  }

  return score;
}

function qualifies(project, pref) {
  if (!ROLLOUT_STATES.includes(project.state)) return false;
  if (!arrayIncludes(pref.target_states, project.state)) return false;
  if (!arrayIncludes(pref.property_types, project.property_type)) return false;
  if (!arraysOverlap(pref.strategies, [project.strategy])) return false;
  if (!priceFits(project.price, pref.min_price, pref.max_price)) return false;

  return true;
}

export async function runPainMatcher(supabase, painProjectId) {
  if (!supabase) throw new Error('Supabase client is required');
  if (!painProjectId) throw new Error('painProjectId is required');

  const { data: project, error: projectError } = await supabase
    .from('pain_projects')
    .select('id, state, property_type, strategy, price, distress')
    .eq('id', painProjectId)
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error('Pain project not found');

  if (!ROLLOUT_STATES.includes(project.state)) {
    return {
      success: true,
      matchesCreated: 0,
      reason: 'Project state is outside rollout states'
    };
  }

  const { data: preferences, error: prefError } = await supabase
    .from('member_match_preferences')
    .select(`
      member_id,
      target_states,
      property_types,
      strategies,
      min_price,
      max_price,
      distress,
      notify_enabled
    `);

  if (prefError) throw prefError;

  const rows = [];

  for (const pref of preferences || []) {
    if (!qualifies(project, pref)) continue;

    rows.push({
      pain_project_id: project.id,
      member_id: pref.member_id,
      match_score: computeScore(project, pref),
      match_reasons: buildReasons(project, pref),
      status: 'new'
    });
  }

  const { error: deleteError } = await supabase
    .from('pain_matches')
    .delete()
    .eq('pain_project_id', project.id);

  if (deleteError) throw deleteError;

  if (!rows.length) {
    return {
      success: true,
      matchesCreated: 0,
      reason: 'No qualified matches found'
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('pain_matches')
    .insert(rows)
    .select();

  if (insertError) throw insertError;

  return {
    success: true,
    matchesCreated: inserted?.length || 0,
    matches: inserted || []
  };
}
