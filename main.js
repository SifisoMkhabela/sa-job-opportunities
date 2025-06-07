// Firebase config and initialization
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

// DOM Elements
const jobsContainer = document.getElementById('jobsContainer');
const jobCount = document.getElementById('jobCount');
const filterForm = document.getElementById('filterForm');
const typeSelect = document.getElementById('typeSelect');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');

const sidebar = document.querySelector('.sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

let allJobs = [];

// Fetch jobs from Firestore
async function fetchJobsFromFirestore() {
  try {
    const snapshot = await db.collection('jobs').get();
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push(doc.data());
    });
    return jobs;
  } catch (error) {
    console.error('Error fetching jobs from Firestore:', error);
    return [];
  }
}

// Render jobs to the DOM
function renderJobs(jobsData) {
  jobsContainer.innerHTML = '';

  if (!jobsData.length) {
    jobsContainer.innerHTML = '<p class="text-center">No job opportunities found.</p>';
    jobCount.textContent = '0';
    return;
  }

  jobCount.textContent = jobsData.length;

  jobsData.forEach(job => {
    const card = document.createElement('div');
    card.classList.add('col-sm-6', 'col-md-4', 'col-lg-3');

    const descriptionPreview = job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description;

    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${job.title}</h5>
          <p class="card-text text-muted mb-1"><strong>Company:</strong> ${job.company || 'N/A'}</p>
          <p class="card-text text-muted mb-2"><strong>Location:</strong> ${job.location || 'N/A'}</p>
          <p class="card-text description mb-2">${descriptionPreview}</p>
          ${job.description.length > 150 ? `<span class="read-toggle text-primary">Read more</span>` : ''}
          <p class="card-text text-secondary mt-auto mb-2"><small>${new Date(job.date).toLocaleDateString()}</small></p>
          <a href="#" class="btn btn-primary mt-auto">Apply</a>
        </div>
      </div>
    `;

    jobsContainer.appendChild(card);
  });

  // Attach event listeners for read more/less toggles
  document.querySelectorAll('.read-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      const descEl = e.target.previousElementSibling;
      const fullText = allJobs.find(job => job.description.startsWith(descEl.textContent.replace('...', ''))).description;

      if (e.target.textContent === 'Read more') {
        descEl.textContent = fullText + ' ';
        e.target.textContent = 'Read less';
      } else {
        descEl.textContent = fullText.substring(0, 150) + '...';
        e.target.textContent = 'Read more';
      }
    });
  });
}

// Filter jobs based on form inputs
function filterJobs(jobsData) {
  let filtered = [...jobsData];

  const selectedType = typeSelect.value;
  const selectedCategory = categorySelect.value;
  const sortOrder = sortSelect.value;

  if (selectedType) {
    filtered = filtered.filter(job => job.type === selectedType);
  }
  if (selectedCategory) {
    filtered = filtered.filter(job => job.category === selectedCategory);
  }

  filtered.sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a.date) - new Date(b.date);
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });

  return filtered;
}

// Populate filter dropdowns dynamically from jobs data
function populateFilterOptions(jobsData) {
  const types = new Set();
  const categories = new Set();

  jobsData.forEach(job => {
    if (job.type) types.add(job.type);
    if (job.category) categories.add(job.category);
  });

  // Clear existing options except the first 'All'
  typeSelect.innerHTML = '<option value="">All Types</option>';
  categorySelect.innerHTML = '<option value="">All Categories</option>';

  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Sidebar toggle handler
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

function showSection(sectionId) {
  const sections = ['jobsSection', 'aboutSection', 'contactSection', 'termsSection', 'policySection'];
  sections.forEach(id => {
    document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
  });

  // Highlight active nav link
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('onclick').includes(sectionId));
  });
}

// Initial setup on page load
document.addEventListener('DOMContentLoaded', async () => {
  showSection('jobsSection');

  allJobs = await fetchJobsFromFirestore();

  populateFilterOptions(allJobs);

  renderJobs(allJobs);

  filterForm.addEventListener('submit', e => {
    e.preventDefault();
    const filteredJobs = filterJobs(allJobs);
    renderJobs(filteredJobs);
  });
});
