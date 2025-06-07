// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCexm1PTk0cst8i3NJxh8MJvqvgm0ys84A",
  authDomain: "sa-job-opportunities.firebaseapp.com",
  projectId: "sa-job-opportunities",
  storageBucket: "sa-job-opportunities.appspot.com",
  messagingSenderId: "756042759528",
  appId: "1:756042759528:web:dd179c0f4c91bfa124ec9c",
  measurementId: "G-ZT87HWK6XD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allJobs = [];
let expandedIndex = null; // To track which job is expanded

// Format date helper (deadline or createdAt)
function formatDate(dateObj) {
  if (!dateObj) return "N/A";
  let date;
  // Firestore timestamp or ISO string support
  if (dateObj.seconds) {
    date = new Date(dateObj.seconds * 1000);
  } else {
    date = new Date(dateObj);
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Load jobs from Firestore
db.collection("jobs").orderBy("createdAt", "desc").get().then(snapshot => {
  allJobs = snapshot.docs.map((doc, index) => {
    const data = doc.data();
    data.id = doc.id;
    data._index = index; // for UI tracking
    return data;
  });

  document.getElementById("jobCountText").textContent = `${allJobs.length} Jobs available in SA`;

  populateFilterOptions(allJobs);
  renderJobs(allJobs);

  // Check if URL has ?jobId= to expand a job
  const urlParams = new URLSearchParams(window.location.search);
  const jobIdParam = urlParams.get('jobId');
  if (jobIdParam) {
    const jobIndex = allJobs.findIndex(job => job.id === jobIdParam);
    if (jobIndex !== -1) {
      expandJob(jobIndex);
    }
  }
}).catch(error => {
  console.error("Error fetching jobs:", error);
  document.getElementById("jobsContainer").innerHTML = `<p class="text-danger">Failed to load jobs. Please try again later.</p>`;
});

// Populate filter dropdowns
function populateFilterOptions(jobs) {
  const typeSet = new Set(jobs.map(job => job.type).filter(Boolean));
  const categorySet = new Set(jobs.map(job => job.category).filter(Boolean));

  const typeSelect = document.getElementById("typeSelect");
  const categorySelect = document.getElementById("categorySelect");

  typeSelect.innerHTML = '<option value="">All Types</option>';
  categorySelect.innerHTML = '<option value="">All Categories</option>';

  typeSet.forEach(type => {
    typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
  });
  categorySet.forEach(category => {
    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

// Render jobs with deadline filtering and black color for deadline text
function renderJobs(jobs) {
  const jobsContainer = document.getElementById("jobsContainer");
  if (jobs.length === 0) {
    jobsContainer.innerHTML = '<p>No jobs found for selected filters.</p>';
    return;
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter out jobs with deadline before today
  const validJobs = jobs.filter(job => {
    if (!job.deadline) return true; // If no deadline, assume valid
    let deadlineDate;
    if (job.deadline.seconds) {
      deadlineDate = new Date(job.deadline.seconds * 1000);
    } else {
      deadlineDate = new Date(job.deadline);
    }
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate >= today;
  });

  if (validJobs.length === 0) {
    jobsContainer.innerHTML = '<p>No jobs found with upcoming deadlines.</p>';
    return;
  }

  jobsContainer.innerHTML = validJobs.map((job, index) => {
    const deadlineFormatted = formatDate(job.deadline);

    return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm position-relative">
        <!-- Share button -->
        <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 share-btn" data-id="${job.id}" title="Share this job">
          <i class="fas fa-share-alt"></i>
        </button>

        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${job.title || 'Untitled Job'}</h5>
          <p class="text-primary mb-1">${job.company || 'Company not specified'}</p>
          <p class="text-secondary mb-2"><i class="fas fa-map-marker-alt me-1"></i>${job.location || 'Location not specified'}</p>
          <p class="card-text mb-1">
            ${job.type ? `<span class="badge bg-secondary">${job.type}</span>` : ''}
            ${job.category ? `<span class="badge bg-info text-dark">${job.category}</span>` : ''}
          </p>
          <p class="text-dark mb-2"><strong>Deadline:</strong> ${deadlineFormatted}</p>

          <div id="readMore-${index}" class="read-more mt-2" style="display: none;">
            ${job.descriptionHTML || '<p>No additional details provided.</p>'}
            <div class="mt-3">
              <a href="${job.link || '#'}" target="_blank" class="btn btn-primary btn-sm">Apply Here</a>
            </div>
          </div>

          <div class="mt-3 text-center">
            <span class="read-toggle" data-index="${index}">Read more</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Add event listeners for Read more toggles
  document.querySelectorAll('.read-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      toggleExpandCollapse(index);
    });
  });

  // Add share button event listeners
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const jobId = this.getAttribute('data-id');
      const shareLink = `${window.location.origin}${window.location.pathname}?jobId=${jobId}`;
      navigator.clipboard.writeText(shareLink).then(() => {
        alert('Share link copied to clipboard!');
      });
    });
  });
}

// Expand/collapse logic for job description
function toggleExpandCollapse(index) {
  if (expandedIndex !== null && expandedIndex !== index) {
    // Collapse previously expanded
    document.getElementById(`readMore-${expandedIndex}`).style.display = 'none';
    toggleText(expandedIndex, false);
  }

  const readMoreDiv = document.getElementById(`readMore-${index}`);
  const isVisible = readMoreDiv.style.display === 'block';

  if (isVisible) {
    // Collapse
    readMoreDiv.style.display = 'none';
    toggleText(index, false);
    expandedIndex = null;
  } else {
    // Expand
    readMoreDiv.style.display = 'block';
    toggleText(index, true);
    expandedIndex = index;
  }
}

// Toggle "Read more" / "Read less" text
function toggleText(index, isExpanded) {
  const toggles = document.querySelectorAll(`.read-toggle[data-index="${index}"]`);
  toggles.forEach(toggle => {
    toggle.textContent = isExpanded ? 'Read less' : 'Read more';
  });
}

// Expand a specific job card by index (used if URL has ?jobId=)
function expandJob(index) {
  const readMoreDiv = document.getElementById(`readMore-${index}`);
  if (readMoreDiv) {
    readMoreDiv.style.display = 'block';
    toggleText(index, true);
    expandedIndex = index;
    // Scroll into view smoothly
    readMoreDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Filter form submission handler
document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const type = document.getElementById('typeSelect').value;
  const category = document.getElementById('categorySelect').value;
  const sort = document.getElementById('sortSelect').value;

  let filteredJobs = [...allJobs];

  if (type) {
    filteredJobs = filteredJobs.filter(job => job.type === type);
  }
  if (category) {
    filteredJobs = filteredJobs.filter(job => job.category === category);
  }

  if (sort === 'asc') {
    filteredJobs.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
  } else {
    filteredJobs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  }

  expandedIndex = null; // reset expand state
  renderJobs(filteredJobs);
});
