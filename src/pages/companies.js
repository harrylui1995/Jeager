/**
 * Companies Search Page
 */

import { searchCompanies } from '../services/linkedin.js';
import { rankCompanies } from '../services/matcher.js';
import { listUserCVs } from '../services/database.js';
import { showLoading, showToast } from '../utils/ui.js';

export async function renderCompaniesPage(container, user) {
  showLoading(container, 'Loading companies...');

  try {
    // Get user's latest CV
    const { data: cvs, error: cvError } = await listUserCVs(user.id, { limit: 1 });
    if (cvError || !cvs || cvs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <h2 class="empty-state-title">No CV Found</h2>
          <p class="empty-state-text">Please upload a CV first to find matching companies.</p>
          <a href="#/upload" class="btn btn-primary">Upload CV</a>
        </div>
      `;
      return;
    }

    const latestCV = cvs[0];
    const cvData = latestCV.extracted_data;

    if (!cvData) {
      showToast('CV data not available. Please re-upload your CV.', 'error');
      return;
    }

    // Search for companies
    const { companies, error: searchError } = await searchCompanies(
      {
        keywords: cvData.skills?.slice(0, 5).map((s) => s.name) || [],
        industries: cvData.industries || [],
      },
      { limit: 20 }
    );

    if (searchError) {
      throw searchError;
    }

    // Rank companies
    const rankedCompanies = rankCompanies(companies, cvData);

    container.innerHTML = `
      <div class="companies-page">
        <div class="search-header">
          <div>
            <h1>Recommended Companies</h1>
            <p class="text-light">Based on your CV: ${latestCV.original_filename}</p>
          </div>
        </div>

        <div class="results-list">
          ${
            rankedCompanies.length > 0
              ? rankedCompanies
                  .map(
                    (company) => `
              <div class="match-card">
                <div class="match-card-header">
                  <div>
                    <h3 class="match-card-title">${company.name}</h3>
                    <div class="match-card-subtitle">${company.industry || 'N/A'} • ${company.location || 'N/A'} • ${company.size || 'N/A'} employees</div>
                  </div>
                  <span class="match-score ${getScoreClass(company.match_score)}">
                    ${Math.round(company.match_score * 100)}% Match
                  </span>
                </div>
                <div class="match-card-body">
                  <p>${company.description || 'No description available.'}</p>
                  ${
                    company.matching_criteria?.matched_skills?.length > 0
                      ? `
                    <div style="margin-top: 1rem;">
                      <strong>Matching Skills:</strong>
                      ${company.matching_criteria.matched_skills
                        .map((skill) => `<span class="skill-tag technical">${skill}</span>`)
                        .join('')}
                    </div>
                  `
                      : ''
                  }
                </div>
                <div class="match-card-footer">
                  <a href="${company.linkedin_url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                    View on LinkedIn
                  </a>
                  <button class="btn btn-secondary btn-sm" onclick="alert('Save feature coming soon!')">
                    Save
                  </button>
                </div>
              </div>
            `
                  )
                  .join('')
              : '<p>No companies found. Try uploading a different CV or refining your profile.</p>'
          }
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load companies: ${error.message}
      </div>
    `;
  }
}

function getScoreClass(score) {
  if (score >= 0.8) {
    return 'excellent';
  }
  if (score >= 0.6) {
    return 'good';
  }
  if (score >= 0.4) {
    return 'fair';
  }
  return 'poor';
}
