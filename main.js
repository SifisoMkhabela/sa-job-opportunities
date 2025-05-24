// js/main.js
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function fetchAndDisplayJobs() {
  try {
    const querySnapshot = await getDocs(collection(db, "jobs"));
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push(doc.data());
    });

    displayJobs(jobs);
  } catch (error) {
    console.error("Error fetching jobs: ", error);
  }
}

function displayJobs(jobs) {
  const jobsList = document.getElementById("jobsList");
  jobsList.innerHTML = "";

  if (jobs.length === 0) {
    jobsList.innerHTML = `<p class="text-center">No jobs available at the moment.</p>`;
    return;
  }

  jobs.forEach(job => {
    const card = document.createElement("div");
    card.className = "col";
    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${job.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${job.company}</h6>
          <p class="card-text">
            <strong>Type:</strong> ${job.type} <br/>
            <strong>Category:</strong> ${job.category} <br/>
            <strong>Location:</strong> ${job.city}, ${job.region} <br/>
            <strong>Experience:</strong> ${job.experience} <br/>
            <strong>Deadline:</strong> ${job.deadline}
          </p>
          <a href="${job.link}" target="_blank" class="btn btn-primary">Find Out More</a>
        </div>
      </div>
    `;
    jobsList.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayJobs();
});
