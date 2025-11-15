/**
 * CV Upload Page
 */

import { uploadCV } from '../services/storage.js';
import { createCVMetadata, updateCVMetadata } from '../services/database.js';
import { parseCV } from '../services/parser.js';
import { showToast, formatFileSize } from '../utils/ui.js';
import { PARSING_STATUS } from '../utils/constants.js';

export function renderUploadPage(container, user) {
  container.innerHTML = `
    <div class="upload-page">
      <h1>Upload Your CV</h1>
      <p class="text-light">Upload your CV to find relevant LinkedIn connections</p>

      <div class="card">
        <div class="file-upload" id="file-upload-area">
          <div class="file-upload-icon">📄</div>
          <div class="file-upload-text">
            <strong>Drag and drop your CV here</strong><br>
            or click to browse
          </div>
          <div style="margin-top: 1rem; color: var(--color-text-light); font-size: 0.875rem;">
            Supported formats: PDF, DOCX, TXT (max 5MB)
          </div>
          <input type="file" id="file-input" accept=".pdf,.docx,.txt" style="display: none;">
        </div>

        <div id="upload-status" class="upload-status" style="display: none;">
          <div class="progress">
            <div class="progress-bar" id="progress-bar" style="width: 0%;"></div>
          </div>
          <div id="status-message" style="margin-top: 1rem; text-align: center;"></div>
        </div>
      </div>

      <div id="cv-preview" style="display: none;"></div>
    </div>
  `;

  setupUploadEventListeners(user);
}

function setupUploadEventListeners(user) {
  const uploadArea = document.getElementById('file-upload-area');
  const fileInput = document.getElementById('file-input');

  // Click to upload
  uploadArea.addEventListener('click', () => fileInput.click());

  // File selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0], user);
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0], user);
    }
  });
}

async function handleFileUpload(file, user) {
  const uploadStatus = document.getElementById('upload-status');
  const statusMessage = document.getElementById('status-message');
  const progressBar = document.getElementById('progress-bar');
  const preview = document.getElementById('cv-preview');

  // Show upload status
  uploadStatus.style.display = 'block';
  preview.style.display = 'none';
  progressBar.style.width = '10%';
  statusMessage.textContent = `Uploading ${file.name} (${formatFileSize(file.size)})...`;

  try {
    // Step 1: Upload file to storage
    const { storagePath, error: uploadError } = await uploadCV(file, user.id);
    if (uploadError) {
      throw uploadError;
    }

    progressBar.style.width = '30%';
    statusMessage.textContent = 'File uploaded! Creating metadata...';

    // Step 2: Create CV metadata record
    const { data: cvMetadata, error: metadataError } = await createCVMetadata({
      user_id: user.id,
      storage_path: storagePath,
      original_filename: file.name,
      file_size_bytes: file.size,
      file_type: file.type,
    });

    if (metadataError) {
      throw metadataError;
    }

    progressBar.style.width = '50%';
    statusMessage.textContent = 'Parsing CV...';

    // Step 3: Parse CV
    const { extractedData, accuracyScore, error: parseError } = await parseCV(file);

    if (parseError) {
      // Mark as failed
      await updateCVMetadata(cvMetadata.id, {
        parsing_status: PARSING_STATUS.FAILED,
        parsing_error: parseError.message,
      });
      throw parseError;
    }

    progressBar.style.width = '90%';
    statusMessage.textContent = 'Saving extracted data...';

    // Step 4: Update CV metadata with extracted data
    await updateCVMetadata(cvMetadata.id, {
      parsing_status: PARSING_STATUS.COMPLETED,
      parsed_at: new Date().toISOString(),
      extracted_data: extractedData,
    });

    progressBar.style.width = '100%';
    statusMessage.innerHTML = `
      <div class="alert alert-success">
        ✓ CV uploaded and analyzed successfully! Accuracy: ${Math.round(accuracyScore * 100)}%
      </div>
    `;

    showToast('CV uploaded and analyzed successfully!', 'success');

    // Show preview
    displayCVPreview(extractedData, preview);
  } catch (error) {
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = 'var(--color-danger)';
    statusMessage.innerHTML = `
      <div class="alert alert-error">
        ✗ Upload failed: ${error.message}
      </div>
    `;
    showToast(`Upload failed: ${error.message}`, 'error');
  }
}

function displayCVPreview(data, container) {
  container.style.display = 'block';
  container.innerHTML = `
    <div class="cv-preview">
      <h3>Extracted CV Data</h3>

      ${
        data.personal
          ? `
        <div class="cv-section">
          <div class="cv-section-title">Personal Information</div>
          <p><strong>Name:</strong> ${data.personal.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${data.personal.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${data.personal.phone || 'N/A'}</p>
          <p><strong>LinkedIn:</strong> ${data.personal.linkedin_url || 'N/A'}</p>
        </div>
      `
          : ''
      }

      ${
        data.skills && data.skills.length > 0
          ? `
        <div class="cv-section">
          <div class="cv-section-title">Skills (${data.skills.length})</div>
          <div>
            ${data.skills
              .map(
                (skill) => `
              <span class="skill-tag ${skill.category}">${skill.name}</span>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        data.experience && data.experience.length > 0
          ? `
        <div class="cv-section">
          <div class="cv-section-title">Experience (${data.experience.length})</div>
          ${data.experience
            .map(
              (exp) => `
            <div style="margin-bottom: 1rem;">
              <div style="font-weight: 600;">${exp.job_title}</div>
              <div style="color: var(--color-text-light);">${exp.company} • ${exp.start_date} - ${exp.end_date}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }

      <div class="mt-3">
        <a href="#/companies" class="btn btn-primary">Find Companies</a>
        <a href="#/profiles" class="btn btn-secondary">Find Profiles</a>
      </div>
    </div>
  `;
}
