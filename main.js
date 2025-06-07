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

// Load jobs
db.collection("jobs").orderBy("createdAt", "desc").get().then(snapshot => {
  allJobs = snapshot.docs.map((doc, index) => {
    const data = doc.data();
    data.id = doc.id;
    data._index = index; // for UI tracking
    return data;
  });

  document.getElementById("jobCount").textContent = allJobs.length;

  populateFilterOptions(allJobs);
  renderJobs(allJobs);

  // Check if link has ?jobId=
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

// Populate dropdowns
function populateFilterOptions(jobs) {
  const typeSet = new Set(jobs.map(job => job.type).filter(Boolean));
  const categorySet = new Set(jobs.map(job => job.category).filter(Boolean));

  const typeSelect = document.getElementById("typeSelect");
  const categorySelect = document.getElementById("categorySelect");

  typeSet.forEach(type => {
    typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
  });
  categorySet.forEach(category => {
    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

// Render jobs
function renderJobs(jobs) {
  const jobsContainer = document.getElementById("jobsContainer");
  if (jobs.length === 0) {
    jobsContainer.innerHTML = '<p>No jobs found for selected filters.</p>';
    return;
  }

  jobsContainer.innerHTML = jobs.map((job, index) => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm position-relative">
        <!-- Share button -->
        <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 share-btn" data-id="${job.id}" title="Share this job">
          <i class="fas fa-share-alt"></i>
        </button>

        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${job.title || 'Untitled Job'}</h5>
          <p class="card-text text-muted">${job.company || 'Company not specified'}</p>
          <p class="card-text mb-2">
            ${job.type ? `<span class="badge bg-secondary">${job.type}</span>` : ''}
            ${job.category ? `<span class="badge bg-info text-dark">${job.category}</span>` : ''}
          </p>
          <div id="readMore-${index}" class="read-more mt-2" style="display: none;">
            ${job.descriptionHTML || '<p>No additional details provided.</p>'}
            <div class="mt-3">
              <a href="${job.link || '#'}" target="_blank" class="btn btn-primary btn-sm">Apply Here</a>
            </div>
            <div class="mt-2">
              <span class="read-toggle text-primary" data-index="${index}" style="cursor: pointer;">Read less</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="read-toggle text-primary" data-index="${index}" style="cursor: pointer;">Read more</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners
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

// Expand/collapse logic
function toggleExpandCollapse(index) {
  if (expandedIndex !== null && expandedIndex !== index) {
    // Collapse previously expanded
    document.getElementById(`readMore-${expandedIndex}`).style.display = "none";
    document.querySelectorAll(`.read-toggle[data-index="${expandedIndex}"]`).forEach(el => {
      el.textContent = "Read more";
    });
  }

  const content = document.getElementById(`readMore-${index}`);
  const isVisible = content.style.display === "block";

  if (isVisible) {
    content.style.display = "none";
    document.querySelectorAll(`.read-toggle[data-index="${index}"]`).forEach(el => {
      el.textContent = "Read more";
    });
    expandedIndex = null;
  } else {
    content.style.display = "block";
    document.querySelectorAll(`.read-toggle[data-index="${index}"]`).forEach(el => {
      el.textContent = "Read less";
    });
    expandedIndex = index;
  }
}

// For deep link expand (called once on page load if jobId present)
function expandJob(index) {
  toggleExpandCollapse(index);
  // Scroll to job
  const jobCard = document.getElementById(`readMore-${index}`);
  if (jobCard) {
    jobCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Filter form submit
document.getElementById("filterForm").addEventListener("submit", function(event) {
  event.preventDefault();
  const selectedType = document.getElementById("typeSelect").value;
  const selectedCategory = document.getElementById("categorySelect").value;
  const selectedSort = document.getElementById("sortSelect").value;

  let filteredJobs = allJobs;

  if (selectedType) {
    filteredJobs = filteredJobs.filter(job => job.type === selectedType);
  }
  if (selectedCategory) {
    filteredJobs = filteredJobs.filter(job => job.category === selectedCategory);
  }

  // Sort
  if (selectedSort === "asc") {
    filteredJobs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
  } else {
    filteredJobs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  }

  expandedIndex = null; // Reset expanded state
  renderJobs(filteredJobs);
});
