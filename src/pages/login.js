/**
 * Login/Signup Page
 */

import { signIn, signUp } from '../services/auth.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { showToast } from '../utils/ui.js';

let isSignupMode = false;

export function renderLoginPage(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>CV Matcher</h1>
          <p>${isSignupMode ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <form id="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              type="email"
              id="email"
              class="form-input"
              placeholder="your@email.com"
              required
            />
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
            <div class="form-error" id="password-error"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg">
            ${isSignupMode ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div class="auth-toggle">
          ${
            isSignupMode
              ? 'Already have an account? <a href="#" id="toggle-mode">Sign In</a>'
              : "Don't have an account? <a href=\"#\" id=\"toggle-mode\">Sign Up</a>"
          }
        </div>
      </div>
    </div>
  `;

  setupAuthEventListeners();
}

function setupAuthEventListeners() {
  const form = document.getElementById('auth-form');
  const toggleLink = document.getElementById('toggle-mode');

  form.addEventListener('submit', handleAuthSubmit);
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    renderLoginPage(document.getElementById('main-content'));
  });
}

async function handleAuthSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Validate inputs
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  emailError.textContent = emailValidation.error || '';
  passwordError.textContent = passwordValidation.error || '';

  if (!emailValidation.valid || !passwordValidation.valid) {
    return;
  }

  // Disable form
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = isSignupMode ? 'Signing up...' : 'Signing in...';

  try {
    if (isSignupMode) {
      const { user, error } = await signUp(email, password);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Account created! Please check your email to verify.', 'success');
        isSignupMode = false;
        renderLoginPage(document.getElementById('main-content'));
      }
    } else {
      const { user, error } = await signIn(email, password);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Welcome back!', 'success');
        window.location.hash = '#/dashboard';
      }
    }
  } catch (err) {
    showToast('An error occurred. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isSignupMode ? 'Sign Up' : 'Sign In';
  }
}
