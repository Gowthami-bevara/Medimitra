export interface ParsedVoiceResult {
  rawSpoken: string;
  structuredDisplay: string;
  parsedValue: any;
  confidence: 'high' | 'medium' | 'low';
}

export function parseName(spoken: string): ParsedVoiceResult {
  const clean = spoken
    .replace(/(?:my name is|i am|name is|పేరు|నా పేరు|मेरा नाम|है|గారు)/gi, '')
    .trim();
  const name = clean || 'User';
  return {
    rawSpoken: spoken,
    structuredDisplay: name,
    parsedValue: name,
    confidence: clean.length > 1 ? 'high' : 'medium',
  };
}

export function parseAge(spoken: string): ParsedVoiceResult {
  const match = spoken.match(/\b([1-9][0-9]?|100)\b/);
  const age = match ? parseInt(match[1], 10) : 28;
  return {
    rawSpoken: spoken,
    structuredDisplay: `${age} Years`,
    parsedValue: age,
    confidence: match ? 'high' : 'medium',
  };
}

export function parseGender(spoken: string): ParsedVoiceResult {
  const lower = spoken.toLowerCase();
  let gender = 'female';
  if (
    lower.includes('male') ||
    lower.includes('man') ||
    lower.includes('పురుష') ||
    lower.includes('పురుషుడు') ||
    lower.includes('पुरुष')
  ) {
    gender = 'male';
  } else if (
    lower.includes('female') ||
    lower.includes('woman') ||
    lower.includes('మహిళ') ||
    lower.includes('స్త్రీ') ||
    lower.includes('महिला') ||
    lower.includes('स्त्री')
  ) {
    gender = 'female';
  }

  return {
    rawSpoken: spoken,
    structuredDisplay: gender.charAt(0).toUpperCase() + gender.slice(1),
    parsedValue: gender,
    confidence: 'high',
  };
}

export function parseSleep(spoken: string): ParsedVoiceResult {
  const match = spoken.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|గంటలు|घंटे)?/i);
  const hours = match ? parseFloat(match[1]) : 7.5;
  return {
    rawSpoken: spoken,
    structuredDisplay: `${hours} hours`,
    parsedValue: hours,
    confidence: match ? 'high' : 'medium',
  };
}

export function parseWater(spoken: string): ParsedVoiceResult {
  const match = spoken.match(/(\d+(?:\.\d+)?)\s*(?:litres|liters|l|లీటర్లు|लीटर)?/i);
  const liters = match ? parseFloat(match[1]) : 2.5;
  return {
    rawSpoken: spoken,
    structuredDisplay: `${liters} Litres`,
    parsedValue: liters,
    confidence: match ? 'high' : 'medium',
  };
}

export function parseMedicines(spoken: string): ParsedVoiceResult {
  const lower = spoken.toLowerCase();
  const takesMeds =
    lower.includes('yes') ||
    lower.includes('medicine') ||
    lower.includes('tablet') ||
    lower.includes('తీసుకుంటా') ||
    lower.includes('మందులు') ||
    lower.includes('దవా') ||
    lower.includes('दवा');
  return {
    rawSpoken: spoken,
    structuredDisplay: takesMeds ? 'Takes Regular Medication' : 'No Regular Medication',
    parsedValue: takesMeds,
    confidence: 'high',
  };
}

export function parseConditions(spoken: string): ParsedVoiceResult {
  const lower = spoken.toLowerCase();
  const conditions: string[] = [];
  if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('బీపీ')) {
    conditions.push('Hypertension (BP)');
  }
  if (lower.includes('sugar') || lower.includes('diabetes') || lower.includes('షుగర్')) {
    conditions.push('Type-2 Diabetes');
  }
  if (lower.includes('thyroid') || lower.includes('థైరాయిడ్')) {
    conditions.push('Thyroid Disorder');
  }
  if (lower.includes('allergy') || lower.includes('ఆలర్జీ')) {
    conditions.push('Seasonal Allergies');
  }

  return {
    rawSpoken: spoken,
    structuredDisplay: conditions.length > 0 ? conditions.join(', ') : 'Healthy / No Known Conditions',
    parsedValue: conditions,
    confidence: 'high',
  };
}
