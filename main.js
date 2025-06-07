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

// Load all jobs initially and populate filters
db.collection("jobs").orderBy("createdAt", "desc").get().then(snapshot => {
  allJobs = snapshot.docs.map(doc => doc.data());
  document.getElementById("jobCount").textContent = allJobs.length;

  populateFilterOptions(allJobs);
  renderJobs(allJobs);
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
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${job.title || 'Untitled Job'}</h5>
          <p class="card-text text-muted">${job.company || 'Company not specified'}</p>
          <p class="card-text mb-2">
            ${job.type ? `<span class="badge bg-secondary">${job.type}</span>` : ''}
            ${job.category ? `<span class="badge bg-info text-dark">${job.category}</span>` : ''}
          </p>
          <div>
            <span class="read-toggle" data-index="${index}">Read more</span>
            <div id="readMore-${index}" class="read-more mt-2">
              ${job.descriptionHTML || '<p>No additional details provided.</p>'}
              <div class="mt-3">
                <a href="${job.link || '#'}" target="_blank" class="btn btn-primary btn-sm">Apply Here</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add toggle event listeners
  document.querySelectorAll('.read-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const content = document.getElementById(`readMore-${index}`);
      if (content.style.display === "block") {
        content.style.display = "none";
        this.textContent = "Read more";
      } else {
        content.style.display = "block";
        this.textContent = "Read less";
      }
    });
  });
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

  renderJobs(filteredJobs);
});
