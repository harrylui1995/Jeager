/**
 * Main Application Entry Point
 * Initializes the app, sets up routing, and handles authentication state
 */

import { getCurrentUser, onAuthStateChange } from './services/auth.js';
import { showToast } from './utils/ui.js';

// Import pages (to be created)
import { renderLoginPage } from './pages/login.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { renderUploadPage } from './pages/upload.js';
import { renderCompaniesPage } from './pages/companies.js';
import { renderProfilesPage } from './pages/profiles.js';

// App state
let currentUser = null;

// Initialize app
async function initApp() {
  console.log('Initializing LinkedIn CV Matcher...');

  // Check authentication status
  const { user, error } = await getCurrentUser();
  if (error) {
    console.error('Auth check failed:', error);
  }

  currentUser = user;

  // Set up auth state listener
  onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    handleAuthStateChange();
  });

  // Initialize router
  setupRouter();

  // Navigate to initial route
  navigateToCurrentHash();
}

/**
 * Handle authentication state changes
 */
function handleAuthStateChange() {
  const navbar = document.getElementById('navbar');
  const logoutBtn = document.getElementById('logout-btn');

  if (currentUser) {
    // User is logged in
    navbar.style.display = 'block';
    if (logoutBtn) {
      logoutBtn.onclick = handleLogout;
    }
  } else {
    // User is logged out
    navbar.style.display = 'none';
    navigateTo('/');
  }
}

/**
 * Set up hash-based router
 */
function setupRouter() {
  window.addEventListener('hashchange', navigateToCurrentHash);

  // Handle navigation link clicks
  document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#/"]')) {
      e.preventDefault();
      const hash = e.target.getAttribute('href');
      window.location.hash = hash;
    }
  });
}

/**
 * Navigate to current hash
 */
function navigateToCurrentHash() {
  const hash = window.location.hash.slice(1) || '/';
  const mainContent = document.getElementById('main-content');

  // Protected routes
  const protectedRoutes = ['/dashboard', '/upload', '/companies', '/profiles'];
  const isProtected = protectedRoutes.some((route) => hash.startsWith(route));

  if (isProtected && !currentUser) {
    // Redirect to login if trying to access protected route
    window.location.hash = '#/';
    return;
  }

  // Route to appropriate page
  switch (true) {
    case hash === '/' || hash === '/login':
      if (currentUser) {
        navigateTo('/dashboard');
      } else {
        renderLoginPage(mainContent);
      }
      break;

    case hash === '/dashboard':
      renderDashboardPage(mainContent, currentUser);
      break;

    case hash === '/upload':
      renderUploadPage(mainContent, currentUser);
      break;

    case hash === '/companies':
      renderCompaniesPage(mainContent, currentUser);
      break;

    case hash === '/profiles':
      renderProfilesPage(mainContent, currentUser);
      break;

    default:
      render404(mainContent);
  }
}

/**
 * Navigate to a specific route
 * @param {string} path - Route path
 */
function navigateTo(path) {
  window.location.hash = `#${path}`;
}

/**
 * Handle logout
 */
async function handleLogout() {
  const { signOut } = await import('./services/auth.js');
  const { error } = await signOut();

  if (error) {
    showToast('Logout failed. Please try again.', 'error');
  } else {
    showToast('Logged out successfully!', 'success');
    navigateTo('/');
  }
}

/**
 * Render 404 page
 * @param {HTMLElement} container
 */
function render404(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <h2 class="empty-state-title">Page Not Found</h2>
      <p class="empty-state-text">The page you're looking for doesn't exist.</p>
      <a href="#/dashboard" class="btn btn-primary">Go to Dashboard</a>
    </div>
  `;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export { navigateTo, currentUser };
