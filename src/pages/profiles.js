/**
 * Profiles Search Page
 */

import { searchProfiles } from '../services/linkedin.js';
import { rankProfiles } from '../services/matcher.js';
import { listUserCVs } from '../services/database.js';
import { showLoading, showToast } from '../utils/ui.js';

export async function renderProfilesPage(container, user) {
  showLoading(container, 'Loading profiles...');

  try {
    // Get user's latest CV
    const { data: cvs, error: cvError } = await listUserCVs(user.id, { limit: 1 });
    if (cvError || !cvs || cvs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <h2 class="empty-state-title">No CV Found</h2>
          <p class="empty-state-text">Please upload a CV first to find matching profiles.</p>
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

    // Search for profiles
    const { profiles, error: searchError } = await searchProfiles(
      {
        keywords: cvData.skills?.slice(0, 5).map((s) => s.name) || [],
      },
      { limit: 30 }
    );

    if (searchError) {
      throw searchError;
    }

    // Rank profiles
    const rankedProfiles = rankProfiles(profiles, cvData);

    container.innerHTML = `
      <div class="profiles-page">
        <div class="search-header">
          <div>
            <h1>Recommended Profiles</h1>
            <p class="text-light">Based on your CV: ${latestCV.original_filename}</p>
          </div>
        </div>

        <div class="results-list">
          ${
            rankedProfiles.length > 0
              ? rankedProfiles
                  .map(
                    (profile) => `
              <div class="match-card">
                <div class="match-card-header">
                  <div>
                    <h3 class="match-card-title">${profile.name}</h3>
                    <div class="match-card-subtitle">
                      ${profile.current_role || 'Professional'} at ${profile.current_company || 'Company'}
                    </div>
                    <div class="match-card-subtitle" style="margin-top: 0.25rem;">
                      ${profile.location || 'N/A'}
                    </div>
                  </div>
                  <span class="match-score ${getScoreClass(profile.match_score)}">
                    ${Math.round(profile.match_score * 100)}% Match
                  </span>
                </div>
                <div class="match-card-body">
                  <p><em>"${profile.headline || 'No headline available.'}"</em></p>
                  ${
                    profile.shared_skills?.length > 0
                      ? `
                    <div style="margin-top: 1rem;">
                      <strong>Shared Skills:</strong>
                      ${profile.shared_skills
                        .map((skill) => `<span class="skill-tag technical">${skill}</span>`)
                        .join('')}
                    </div>
                  `
                      : ''
                  }
                  ${
                    profile.conversation_starter
                      ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: var(--color-bg-gray); border-radius: var(--radius-md);">
                      <strong>Conversation Starter:</strong><br>
                      <em>"${profile.conversation_starter}"</em>
                    </div>
                  `
                      : ''
                  }
                </div>
                <div class="match-card-footer">
                  <a href="${profile.linkedin_url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
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
              : '<p>No profiles found. Try uploading a different CV or refining your profile.</p>'
          }
        </div>
      </div>
    `;
  } catch (error) {
    // Format error message to preserve newlines and provide better visibility
    const errorMessage = error.message || 'Unknown error occurred';
    const formattedMessage = errorMessage.replace(/\n/g, '<br>');
    
    container.innerHTML = `
      <div class="alert alert-error" style="white-space: pre-wrap; line-height: 1.6;">
        <strong>Failed to load profiles:</strong><br>
        ${formattedMessage}
        <br><br>
        <strong>Quick Fix:</strong>
        <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
          <li>Check your <code>.env</code> file has <code>VITE_LINKEDIN_PROVIDER=rapidapi</code> and <code>VITE_LINKEDIN_API_KEY=your-key</code></li>
          <li>Restart your dev server after changing <code>.env</code> file</li>
          <li>Verify your API key at <a href="https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper" target="_blank">RapidAPI Dashboard</a></li>
          <li>Or use mock data by setting <code>VITE_LINKEDIN_PROVIDER=mock</code> in <code>.env</code></li>
        </ul>
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
