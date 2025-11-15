/**
 * Dashboard Page
 */

import { listUserCVs } from '../services/database.js';
import { showLoading, formatDate } from '../utils/ui.js';

export async function renderDashboardPage(container, user) {
  showLoading(container, 'Loading dashboard...');

  try {
    // Fetch user's CVs
    const { data: cvs, error } = await listUserCVs(user.id, { limit: 10 });

    if (error) {
      throw error;
    }

    const latestCV = cvs?.[0];

    container.innerHTML = `
      <div class="dashboard">
        <h1>Dashboard</h1>
        <p class="text-light">Welcome back, ${user.email}</p>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-card-label">Total CVs Uploaded</div>
            <div class="stat-card-value">${cvs?.length || 0}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-label">Companies Found</div>
            <div class="stat-card-value">0</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-label">Profiles Matched</div>
            <div class="stat-card-value">0</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Recent Activity</div>
          <div class="card-body">
            ${
              cvs && cvs.length > 0
                ? `
              <div class="cv-list">
                ${cvs
                  .map(
                    (cv) => `
                  <div class="cv-item" style="padding: 1rem; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 600;">${cv.original_filename}</div>
                        <div style="font-size: 0.875rem; color: var(--color-text-light);">
                          Uploaded ${formatDate(cv.uploaded_at)}
                        </div>
                      </div>
                      <div>
                        <span class="badge badge-${cv.parsing_status === 'completed' ? 'success' : 'warning'}">
                          ${cv.parsing_status}
                        </span>
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : `
              <div class="empty-state">
                <p>No CVs uploaded yet.</p>
                <a href="#/upload" class="btn btn-primary">Upload Your First CV</a>
              </div>
            `
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">Quick Actions</div>
          <div class="card-body">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="#/upload" class="btn btn-primary">Upload New CV</a>
              <a href="#/companies" class="btn btn-secondary">Browse Companies</a>
              <a href="#/profiles" class="btn btn-secondary">Find Profiles</a>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load dashboard: ${error.message}
      </div>
    `;
  }
}
