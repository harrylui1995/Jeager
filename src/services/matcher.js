/**
 * Matcher Service
 * Calculates match scores and ranks recommendations
 */

/**
 * Rank companies based on CV profile
 * @param {Array} companies - Companies from LinkedIn search
 * @param {object} cvData - Extracted CV data
 * @returns {Array} Ranked companies with match scores
 */
export function rankCompanies(companies, cvData) {
  if (!companies || !cvData) {
    return [];
  }

  const rankedCompanies = companies.map((company) => {
    const matchScore = calculateCompanyMatchScore(company, cvData);
    const matchingCriteria = getCompanyMatchingCriteria(company, cvData);

    return {
      ...company,
      match_score: parseFloat(matchScore.toFixed(2)),
      matching_criteria: matchingCriteria,
    };
  });

  // Sort by match score descending
  return rankedCompanies.sort((a, b) => b.match_score - a.match_score);
}

/**
 * Calculate company match score
 * Algorithm:
 * - Industry match (40% weight)
 * - Skills match (30% weight)
 * - Location match (20% weight)
 * - Size preference (10% weight)
 * @param {object} company
 * @param {object} cvData
 * @returns {number} Score 0.00-1.00
 */
function calculateCompanyMatchScore(company, cvData) {
  let score = 0.0;

  // Industry match (40%)
  const cvIndustries = cvData.industries || [];
  const industryMatch = cvIndustries.some((ind) =>
    company.industry?.toLowerCase().includes(ind.toLowerCase())
  );
  if (industryMatch) {
    score += 0.4;
  }

  // Skills match (30%)
  const cvSkills = (cvData.skills || []).map((s) => s.name.toLowerCase());
  const companyText = `${company.name} ${company.description}`.toLowerCase();
  const matchingSkills = cvSkills.filter((skill) => companyText.includes(skill));
  const skillsScore = Math.min(matchingSkills.length / Math.max(cvSkills.length, 1), 1.0);
  score += skillsScore * 0.3;

  // Location match (20%) - simplified
  const cvLocation = cvData.personal?.location;
  if (cvLocation && company.location?.includes(cvLocation)) {
    score += 0.2;
  } else if (company.location) {
    score += 0.1; // Partial credit if location exists
  }

  // Size preference (10%) - prefer mid-size companies
  if (company.size && (company.size.includes('51-200') || company.size.includes('201-500'))) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Get company matching criteria explanation
 * @param {object} company
 * @param {object} cvData
 * @returns {object} Matching criteria
 */
function getCompanyMatchingCriteria(company, cvData) {
  const cvSkills = (cvData.skills || []).map((s) => s.name);
  const cvIndustries = cvData.industries || [];
  const companyText = `${company.name} ${company.description}`.toLowerCase();

  const matchedSkills = cvSkills.filter((skill) =>
    companyText.includes(skill.toLowerCase())
  );

  const matchedIndustries = cvIndustries.filter((ind) =>
    company.industry?.toLowerCase().includes(ind.toLowerCase())
  );

  return {
    matched_skills: matchedSkills.slice(0, 5),
    matched_industries: matchedIndustries,
    location_match: company.location?.includes(cvData.personal?.location || '') || false,
    size_preference: company.size,
    explanation: `Matches ${matchedSkills.length} of your key skills and operates in your target industry.`,
  };
}

/**
 * Rank profiles based on CV data
 * Algorithm:
 * - Shared skills (40% weight)
 * - Industry/interests (30% weight)
 * - Seniority alignment (20% weight)
 * - Location (10% weight)
 * @param {Array} profiles - Profiles from LinkedIn search
 * @param {object} cvData - Extracted CV data
 * @returns {Array} Ranked profiles with match scores
 */
export function rankProfiles(profiles, cvData) {
  if (!profiles || !cvData) {
    return [];
  }

  const rankedProfiles = profiles.map((profile) => {
    const matchScore = calculateProfileMatchScore(profile, cvData);
    const sharedSkills = getSharedSkills(profile, cvData);
    const sharedInterests = getSharedInterests(profile, cvData);
    const conversationStarter = generateConversationStarter(profile, cvData);

    return {
      ...profile,
      match_score: parseFloat(matchScore.toFixed(2)),
      shared_skills: sharedSkills,
      shared_interests: sharedInterests,
      conversation_starter: conversationStarter,
    };
  });

  // Sort by match score descending
  return rankedProfiles.sort((a, b) => b.match_score - a.match_score);
}

/**
 * Calculate profile match score
 * @param {object} profile
 * @param {object} cvData
 * @returns {number} Score 0.00-1.00
 */
function calculateProfileMatchScore(profile, cvData) {
  let score = 0.0;

  // Shared skills (40%)
  const cvSkills = (cvData.skills || []).map((s) => s.name.toLowerCase());
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const sharedCount = cvSkills.filter((skill) => profileSkills.includes(skill)).length;
  const skillsScore = Math.min(sharedCount / Math.max(cvSkills.length, 1), 1.0);
  score += skillsScore * 0.4;

  // Industry/interests (30%)
  const cvIndustries = (cvData.industries || []).map((i) => i.toLowerCase());
  const profileText = `${profile.headline} ${profile.current_company}`.toLowerCase();
  const industryMatch = cvIndustries.some((ind) => profileText.includes(ind));
  if (industryMatch) {
    score += 0.3;
  }

  // Seniority alignment (20%) - simplified
  const cvExperience = cvData.experience?.length || 0;
  const isSeniorRole = /senior|lead|manager|director/i.test(profile.current_role || '');
  if (cvExperience >= 5 && isSeniorRole) {
    score += 0.2;
  } else if (cvExperience < 5 && !isSeniorRole) {
    score += 0.2;
  } else {
    score += 0.1;
  }

  // Location (10%)
  const cvLocation = cvData.personal?.location;
  if (cvLocation && profile.location?.includes(cvLocation)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Get shared skills between profile and CV
 * @param {object} profile
 * @param {object} cvData
 * @returns {Array<string>} Shared skills
 */
function getSharedSkills(profile, cvData) {
  const cvSkills = (cvData.skills || []).map((s) => s.name.toLowerCase());
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase());
  return cvSkills.filter((skill) => profileSkills.includes(skill)).slice(0, 5);
}

/**
 * Get shared interests/industries
 * @param {object} profile
 * @param {object} cvData
 * @returns {Array<string>} Shared interests
 */
function getSharedInterests(profile, cvData) {
  const cvIndustries = cvData.industries || [];
  const profileText = `${profile.headline} ${profile.current_company}`.toLowerCase();
  return cvIndustries.filter((ind) => profileText.includes(ind.toLowerCase()));
}

/**
 * Generate a personalized conversation starter
 * @param {object} profile
 * @param {object} cvData
 * @returns {string} Conversation starter
 */
export function generateConversationStarter(profile, cvData) {
  const sharedSkills = getSharedSkills(profile, cvData);
  const sharedInterests = getSharedInterests(profile, cvData);

  if (sharedSkills.length > 0 && sharedInterests.length > 0) {
    return `Hi ${profile.name?.split(' ')[0]}, I noticed we both have experience with ${sharedSkills[0]} and share an interest in ${sharedInterests[0]}. I'm currently exploring opportunities in this space and would love to hear about your journey to ${profile.current_role} at ${profile.current_company}.`;
  } else if (sharedSkills.length > 0) {
    return `Hi ${profile.name?.split(' ')[0]}, I saw that we both work with ${sharedSkills[0]}. I'd love to learn more about how you use it in your role at ${profile.current_company}.`;
  } else if (sharedInterests.length > 0) {
    return `Hi ${profile.name?.split(' ')[0]}, I'm interested in ${sharedInterests[0]} and noticed you're working in this field. Would you be open to a brief chat about your experience at ${profile.current_company}?`;
  } else {
    return `Hi ${profile.name?.split(' ')[0]}, I came across your profile and am impressed by your work at ${profile.current_company}. I'd love to connect and learn more about your career path.`;
  }
}

export default {
  rankCompanies,
  rankProfiles,
  generateConversationStarter,
};
