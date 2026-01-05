const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Global state
let currentUser = null;
let allSkills = []; // Store for filtering

// Search & Filter state
let currentCategory = "All";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", () => {
  fetchSkills();
  setupLogout();
  setupFilters();
});

function setupFilters() {
  // Search Input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase();
      applyFilters();
    });
  }

  // Category Buttons
  const buttons = document.querySelectorAll("#categoryFilters button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Update active state
      buttons.forEach(b => b.classList.replace("btn-primary", "btn-secondary"));
      btn.classList.replace("btn-secondary", "btn-primary");

      currentCategory = btn.getAttribute("data-cat");
      applyFilters();
    });
  });
}

function applyFilters() {
  const filtered = allSkills.filter(skill => {
    // 1. Category Match
    const catMatch = currentCategory === "All" || skill.category === currentCategory;

    // 2. Search Match (Name, Tutor, Outcome)
    const textToSearch = `${skill.name} ${skill.tutorName || ""} ${skill.outcome || ""}`.toLowerCase();
    const searchMatch = !searchTerm || textToSearch.includes(searchTerm);

    return catMatch && searchMatch;
  });
  renderSkills(filtered);
}

async function fetchSkills() {
  try {
    const res = await fetch("http://localhost:5000/api/skills", {
      headers: { "x-auth-token": token },
    });
    allSkills = await res.json(); // Store globally

    // Also fetch user credit balance for display
    fetchProfile();

    applyFilters(); // Initial render
  } catch (err) {
    console.error(err);
    showToast("Failed to load skills", true);
  }
}

function renderSkills(skills) {
  const container = document.getElementById("skillsContainer");
  container.innerHTML = "";

  if (skills.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No skills found matching your criteria.</p>`;
    return;
  }

  skills.forEach((skill) => {
    const card = document.createElement("div");
    card.className = "card";

    // Status Logic
    let statusBadge = "";
    let actionBtn = "";

    if (skill.isTeaching) {
      statusBadge = `<span class="badge badge-primary">You Teach This</span>`;
      // Show Video for Teacher
      if (skill.videoUrl) {
        actionBtn += `
            <div style="margin-bottom: 10px;">
                <video src="${skill.videoUrl}" controls style="width: 100%; border-radius: 8px;"></video>
            </div>`;
      }
      actionBtn += `<button class="btn btn-secondary" disabled style="width:100%">Teaching</button>`;

    } else if (skill.isLearning) {
      statusBadge = `<span class="badge badge-green">In Progress</span>`;

      // Show Video for Learner
      if (skill.videoUrl) {
        actionBtn += `
            <div style="margin-bottom: 10px;">
                <label style="font-size:0.8rem; color:var(--primary); margin-bottom:4px; display:block;">🎥 Class Recording:</label>
                <video src="${skill.videoUrl}" controls style="width: 100%; border-radius: 8px;"></video>
            </div>`;
      }

      actionBtn += `
        <button class="btn btn-primary" onclick="completeSkill('${skill._id}', '${skill.createdBy}')" style="width:100%">
          Target Complete & Rate
        </button>`;

    } else {
      // Not learning, not teaching.
      // Check if can afford
      const canAfford = currentUser ? currentUser.credits.available >= skill.creditCost : true;

      const enrollBtn = `
            <button class="btn btn-primary" onclick="enrollSkill('${skill._id}')" ${!canAfford ? 'disabled' : ''} style="width:100%">
                Enroll (-${skill.creditCost} Credits)
            </button>
        `;

      const teachBtn = `
            <button class="btn btn-secondary" onclick="teachSkill('${skill._id}')" style="width:100%; margin-top: 8px;">
                Teach This
            </button>
        `;

      actionBtn = enrollBtn + teachBtn;
    }

    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
            <h3 style="font-size: 1.25rem; margin-bottom: 4px;">${skill.name}</h3>
            <span style="font-size: 0.8rem; color: var(--secondary);">by ${skill.tutorName || "Unknown"}</span>
        </div>
        ${statusBadge}
      </div>
      
      <div style="margin-bottom: 1rem;">
        <p style="font-size: 0.9rem; font-weight: bold; color: #ccc; margin-bottom: 4px;">Outcome:</p>
        <p style="color: var(--text-muted); font-size: 0.9rem; min-height: 40px;">
            ${skill.outcome || skill.description || "No outcome specified."}
        </p>
      </div>
      
      <div class="flex justify-between items-center mb-4" style="font-size: 0.9rem;">
        <span class="badge badge-purple">${skill.category || "General"}</span>
        <span style="color: var(--secondary); font-weight: bold;">${skill.creditCost} Credits</span>
      </div>

      <div>${actionBtn}</div>
    `;

    container.appendChild(card);
  });
}

// APP ACTIONS

async function enrollSkill(id) {
  if (!confirm("Spend credits to enroll?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/skills/learn/${id}`, {
      method: "POST",
      headers: { "x-auth-token": token },
    });
    const data = await res.json();

    if (res.ok) {
      showToast("Enrolled successfully!");
      fetchSkills(); // refresh
    } else {
      showToast(data.msg, true);
    }
  } catch (err) { console.error(err); }
}

async function teachSkill(id) {
  if (!confirm("Start teaching this skill? You will earn credits when students enroll.")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/skills/teach/${id}`, {
      method: "POST",
      headers: { "x-auth-token": token },
    });
    const data = await res.json();

    if (res.ok) {
      showToast("You are now a teacher!");
      fetchSkills();
    } else {
      showToast(data.msg, true);
    }
  } catch (err) { console.error(err); }
}

// Complete & Rate Flow
let pendingTeacherId = null;

async function completeSkill(skillId, teacherId) {
  // 1. Mark complete
  try {
    const res = await fetch(`http://localhost:5000/api/skills/complete/${skillId}`, {
      method: "POST",
      headers: { "x-auth-token": token },
    });
    const data = await res.json();

    if (res.ok) {
      showToast("Skill Completed!");
      // 2. Open Rate Modal if there is a teacher
      if (teacherId) {
        pendingTeacherId = teacherId;
        document.getElementById("rateModal").style.display = "flex";
      } else {
        fetchSkills();
      }
    } else {
      showToast(data.msg, true);
    }
  } catch (e) { console.error(e); }
}

// Star Rating Logic
window.setRating = (val) => {
  document.getElementById("ratingValue").value = val;
  // visual feedback could go here
  alert(`Selected ${val} Stars`);
}

window.submitRating = async () => {
  const val = document.getElementById("ratingValue").value;
  if (!pendingTeacherId) return;

  try {
    const res = await fetch(`http://localhost:5000/api/skills/rate/${pendingTeacherId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ rating: Number(val) })
    });

    if (res.ok) {
      showToast("Rating Submitted!");
      closeModal();
      fetchSkills();
    }
  } catch (e) { console.error(e); }
}

window.closeModal = () => {
  document.getElementById("rateModal").style.display = "none";
  pendingTeacherId = null;
  fetchSkills(); // Refresh UI to show 'Teach' option now available or updated state
}
