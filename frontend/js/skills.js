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
  // Search Input - Enter Key
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchTerm = e.target.value.toLowerCase();
        applyFilters();
      }
    });
  }

  // Search Button - Click
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const val = document.getElementById("searchInput")?.value || "";
      searchTerm = val.toLowerCase();
      applyFilters();
    });
  }

  // Category Dropdown - Change
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      currentCategory = e.target.value;
      applyFilters();
    });
  }
}

function applyFilters() {
  const filtered = allSkills.filter(skill => {
    // 1. Category Match
    const catMatch = currentCategory === "All" || skill.category === currentCategory;

    // 2. Search Match (Name, Tutor, Outcome)
    const textToSearch = `${skill.name} ${skill.tutorName || ""} ${skill.outcome || ""}`.toLowerCase();
    const searchMatch = !searchTerm || textToSearch.includes(searchTerm);

    // 3. Must have Video (User Request: "only see available video content")
    const hasVideo = skill.videoUrl && skill.videoUrl.trim() !== "";

    return catMatch && searchMatch && hasVideo;
  });
  renderSkills(filtered);
}

async function fetchSkills() {
  try {
    const res = await fetch("http://localhost:5000/api/skills", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    allSkills = await res.json(); // Store globally

    // Also fetch user credit balance for display
    fetchProfile();

    applyFilters(); // Initial render
  } catch (err) {
    console.error(err);
    showToast("Failed to load skills", true);
  }
}

function handleAuthError() {
  alert("Session expired. Please login again.");
  localStorage.removeItem("token");
  window.location.href = "login.html";
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
    card.className = "skill-card"; // New class

    // Status Badge Logic
    let statusBadge = "";
    let actionBtn = "";

    // -- ACTION LOGIC --
    if (skill.isTeaching) {
      statusBadge = `<span class="badge badge-primary" style="font-size: 0.75rem;">You Teach This</span>`;
      actionBtn = `<button class="btn btn-secondary w-full" disabled>Active Teacher</button>`;
    } else if (skill.isEnrolled) {
      statusBadge = `<span class="badge badge-success" style="font-size: 0.75rem;">Enrolled</span>`;
      if (skill.isCompleted) {
        actionBtn = `<button class="btn btn-secondary w-full" disabled>Completed</button>`;
      } else {
        // UPDATED: Redirect to Quiz Page instead of instant complete
        // If quizId exists, go there. Check compatibility.
        if (skill.quizId) {
          actionBtn = `<button class="btn btn-primary w-full" onclick="goToQuiz('${skill.quizId}')">Take Quiz Result</button>`;
        } else {
          // Fallback for old skills without quiz
          actionBtn = `<button class="btn btn-primary w-full" onclick="completeSkill('${skill._id}', '${skill.tutor}')">Mark Complete</button>`;
        }
      }
    } else {
      // Not enrolled, not teaching
      actionBtn = `<button class="btn btn-glow w-full" onclick="enrollSkill('${skill._id}')">Enroll Now</button>`;

      // If user created it but isn't marked as 'teaching' (edge case, but handled)
      if (currentUser && skill.tutor === currentUser._id) {
        actionBtn = `<button class="btn btn-secondary w-full" disabled>Your Skill</button>`;
      }
    }


    // Video Section (Always show if exists, using placeholder if null for layout consistency)
    const videoSrc = skill.videoUrl || "";
    const videoHTML = videoSrc ?
      `<video src="${videoSrc}" controls preload="metadata"></video>` :
      `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; color:#555;">No Preview</div>`;

    card.innerHTML = `
      <!-- Media Area -->
      <div class="skill-media">
        ${videoHTML}
        <div style="position: absolute; top: 10px; right: 10px;">
            <span class="badge badge-purple" style="backdrop-filter: blur(4px); background: rgba(138, 43, 226, 0.6);">${skill.category || "General"}</span>
            ${statusBadge}
        </div>
      </div>

      <!-- Content Body -->
      <div class="skill-content">
        <div class="skill-header">
            <h3 class="skill-title">${skill.name}</h3>
        </div>
        
        <span class="skill-tutor">by ${skill.tutorName || "Unknown Tutor"}</span>
        
        <p class="skill-desc">
            ${skill.outcome || skill.description || "Unlock this skill to expand your capabilities."}
        </p>
      </div>

      <!-- Footer & Actions -->
      <div class="skill-footer">
        <div class="skill-price">
            <span>💎</span> ${skill.creditCost}
        </div>
        <div style="flex: 1; padding-left: 1rem;">
             ${actionBtn}
        </div>
      </div>
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
      headers: { "Authorization": `Bearer ${token}` },
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
      headers: { "Authorization": `Bearer ${token}` },
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
      headers: { "Authorization": `Bearer ${token}` },
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
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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

async function fetchProfile() {
  if (!token) return;
  try {
    const res = await fetch("http://localhost:5000/api/profile/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
      const credEl = document.getElementById("creditDisplay");
      if (credEl && currentUser.credits) {
        credEl.textContent = currentUser.credits.available;
      }
    }
  } catch (e) { console.error("Profile fetch error", e); }
}
