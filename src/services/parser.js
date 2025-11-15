/**
 * CV Parser Service
 * Extracts structured data from CV files using PDF.js and Mammoth.js
 */

import * as pdfjsLib from 'pdfjs-dist';
// Import worker as URL - Vite will handle bundling correctly
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { ALLOWED_FILE_TYPES, SKILL_CATEGORIES } from '../utils/constants.js';

// Configure PDF.js worker - use local worker file instead of CDN
// This avoids network issues and version mismatches
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Common technical skills dictionary (sample - extend as needed)
const TECHNICAL_SKILLS = [
  'javascript', 'python', 'java', 'c++', 'react', 'vue', 'angular', 'node.js',
  'typescript', 'go', 'rust', 'sql', 'postgresql', 'mongodb', 'redis',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'ci/cd',
  'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
];

// Common soft skills dictionary (sample)
const SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'problem-solving',
  'critical thinking', 'time management', 'collaboration', 'adaptability',
  'creativity', 'emotional intelligence', 'negotiation', 'public speaking',
];

/**
 * Parse a CV file and extract structured information
 * @param {File} file - CV file (PDF, DOCX, or TXT)
 * @returns {Promise<{extractedData, accuracyScore, error}>}
 */
export async function parseCV(file) {
  try {
    let text = '';

    // Extract text based on file type
    if (file.type === ALLOWED_FILE_TYPES.PDF) {
      const result = await extractTextFromPDF(file);
      if (result.error) {
        return { extractedData: null, accuracyScore: 0, error: result.error };
      }
      text = result.text;
    } else if (file.type === ALLOWED_FILE_TYPES.DOCX) {
      const result = await extractTextFromDOCX(file);
      if (result.error) {
        return { extractedData: null, accuracyScore: 0, error: result.error };
      }
      text = result.text;
    } else if (file.type === ALLOWED_FILE_TYPES.TXT) {
      text = await file.text();
    } else {
      return {
        extractedData: null,
        accuracyScore: 0,
        error: new Error('Unsupported file type'),
      };
    }

    // Extract structured data from text
    const extractedData = {
      personal: extractContactInfo(text),
      summary: extractSummary(text),
      skills: extractSkills(text),
      experience: extractExperience(text),
      education: extractEducation(text),
      industries: extractIndustries(text),
      career_goals: extractCareerGoals(text),
      accuracy_score: calculateAccuracyScore(text),
    };

    return {
      extractedData,
      accuracyScore: extractedData.accuracy_score,
      error: null,
    };
  } catch (err) {
    return {
      extractedData: null,
      accuracyScore: 0,
      error: new Error(`Parsing failed: ${err.message}`),
    };
  }
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<{text, error}>}
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return { text: fullText, error: null };
  } catch (err) {
    return { text: '', error: new Error(`PDF extraction failed: ${err.message}`) };
  }
}

/**
 * Extract text from DOCX file
 * @param {File} file - DOCX file
 * @returns {Promise<{text, error}>}
 */
async function extractTextFromDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value, error: null };
  } catch (err) {
    return { text: '', error: new Error(`DOCX extraction failed: ${err.message}`) };
  }
}

/**
 * Extract contact information
 * @param {string} text - CV text
 * @returns {object} Contact information
 */
export function extractContactInfo(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /linkedin\.com\/in\/[A-Za-z0-9-]+/i;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const linkedinMatch = text.match(linkedinRegex);

  // Try to extract name (first line or first few words)
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const name = lines[0]?.trim() || 'Unknown';

  return {
    name,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    linkedin_url: linkedinMatch ? `https://${linkedinMatch[0]}` : null,
    location: null, // Could enhance with location extraction
  };
}

/**
 * Extract professional summary
 * @param {string} text - CV text
 * @returns {string} Summary
 */
export function extractSummary(text) {
  // Look for summary/objective section
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some((keyword) => line.includes(keyword))) {
      // Return next 2-3 lines as summary
      return lines
        .slice(i + 1, i + 4)
        .join(' ')
        .trim();
    }
  }

  // Fallback: return first paragraph
  return lines.slice(1, 4).join(' ').trim();
}

/**
 * Extract skills from text
 * @param {string} text - CV text
 * @returns {Array<{name, category}>} Skills
 */
export function extractSkills(text) {
  const textLower = text.toLowerCase();
  const foundSkills = [];

  // Extract technical skills
  TECHNICAL_SKILLS.forEach((skill) => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push({ name: skill, category: SKILL_CATEGORIES.TECHNICAL });
    }
  });

  // Extract soft skills
  SOFT_SKILLS.forEach((skill) => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push({ name: skill, category: SKILL_CATEGORIES.SOFT });
    }
  });

  return foundSkills;
}

/**
 * Extract work experience
 * @param {string} text - CV text
 * @returns {Array<object>} Experience entries
 */
export function extractExperience(text) {
  // Simplified extraction - look for year patterns and job titles
  const experiences = [];
  const lines = text.split('\n');
  const yearRegex = /\b(19|20)\d{2}\b/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const years = line.match(yearRegex);

    if (years && years.length >= 1) {
      // Likely an experience entry
      experiences.push({
        job_title: line.split(/\d{4}/)[0].trim() || 'Position',
        company: 'Company', // Would need more sophisticated extraction
        location: null,
        start_date: years[0],
        end_date: years[years.length - 1],
        duration_months: calculateMonths(years[0], years[years.length - 1]),
        description: lines[i + 1]?.trim() || '',
      });
    }
  }

  return experiences.slice(0, 5); // Return top 5
}

/**
 * Extract education
 * @param {string} text - CV text
 * @returns {Array<object>} Education entries
 */
export function extractEducation(text) {
  const education = [];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'mba', 'b.s.', 'm.s.', 'b.a.', 'm.a.'];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    const hasDegree = degreeKeywords.some((keyword) => lineLower.includes(keyword));

    if (hasDegree) {
      const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
      education.push({
        degree: lines[i].trim(),
        institution: lines[i + 1]?.trim() || 'University',
        graduation_year: yearMatch ? parseInt(yearMatch[0]) : null,
      });
    }
  }

  return education.slice(0, 3);
}

/**
 * Extract industries from text
 * @param {string} text - CV text
 * @returns {Array<string>} Industries
 */
export function extractIndustries(text) {
  const commonIndustries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Consulting', 'SaaS', 'Fintech', 'E-commerce',
  ];

  const textLower = text.toLowerCase();
  return commonIndustries.filter((industry) =>
    textLower.includes(industry.toLowerCase())
  );
}

/**
 * Extract career goals
 * @param {string} text - CV text
 * @returns {string} Career goals
 */
export function extractCareerGoals(text) {
  const goalKeywords = ['seeking', 'looking for', 'interested in', 'goal', 'objective'];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (goalKeywords.some((keyword) => lineLower.includes(keyword))) {
      return lines[i].trim();
    }
  }

  return 'Seeking new opportunities';
}

/**
 * Calculate accuracy score based on extracted data completeness
 * @param {string} text - CV text
 * @returns {number} Accuracy score 0.00-1.00
 */
function calculateAccuracyScore(text) {
  let score = 0.0;
  const checks = [
    text.includes('@'), // Has email
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text), // Has phone
    /linkedin\.com/i.test(text), // Has LinkedIn
    /(19|20)\d{2}/.test(text), // Has years/experience
    /bachelor|master|phd/i.test(text), // Has education
  ];

  score = checks.filter(Boolean).length / checks.length;
  return Math.min(score + 0.2, 1.0); // Baseline + bonus
}

/**
 * Calculate months between two years
 * @param {string} startYear
 * @param {string} endYear
 * @returns {number} Months
 */
function calculateMonths(startYear, endYear) {
  const start = parseInt(startYear);
  const end = parseInt(endYear);
  return (end - start) * 12;
}

export default {
  parseCV,
  extractSkills,
  extractExperience,
  extractEducation,
  extractContactInfo,
};
