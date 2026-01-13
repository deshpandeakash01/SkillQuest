// document.addEventListener("DOMContentLoaded", async () => {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     alert("Session expired. Please login again.");
//     window.location.href = "login.html";
//     return;
//   }

//   try {
//     const res = await fetch("http://localhost:5000/api/profile/me", {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });

// if (!res.ok) {
//   throw new Error("Unauthorized");
// }


//     const user = await res.json();

//     // Basic info
//     document.getElementById("welcome-message").textContent =
//       `Welcome, ${user.name}`;

//     document.getElementById("profile-email").textContent = user.email;

//     document.getElementById("profile-credits").textContent =
//       user.credits?.available ?? 0;

//     // Render skill sections
//     renderList("user-interests", user.skillsInterested);
//     renderList("user-learning", user.skillsLearning);
//     renderList("user-teaching", user.skillsTeach);
//     renderActivity(user.activity);

//   } catch (err) {
//     console.error(err);
//     alert("Session expired. Please login again.");
//     localStorage.removeItem("token");
//     window.location.href = "login.html";
//   }
// });

// function renderList(elementId, list) {
//   const container = document.getElementById(elementId);
//   container.innerHTML = "";

//   if (!list || list.length === 0) {
//     container.innerHTML = "<p>None</p>";
//     return;
//   }

//   list.forEach(item => {
//     const tag = document.createElement("span");
//     tag.className = "skill-tag";
//     tag.textContent = item;
//     container.appendChild(tag);
//   });
// }

// function renderActivity(activity) {
//   const container = document.getElementById("user-activity");
//   container.innerHTML = "";

//   if (!activity || activity.length === 0) {
//     container.innerHTML = "<p>No recent activity</p>";
//     return;
//   }

//   activity.slice().reverse().forEach(log => {
//     const p = document.createElement("p");
//     p.textContent = log;
//     container.appendChild(p);
//   });
// }


// document.addEventListener("DOMContentLoaded", () => {
//   const token = localStorage.getItem("token");
//   // const userData = localStorage.getItem("user"); 

//   if (!token) {
//     alert("Session expired. Please login again.");
//     window.location.href = "login.html";
//     return;
//   }

//   // const user = JSON.parse(userData);

//   /* =====================
//      BASIC INFO
//      ===================== */
//   document.getElementById("welcome-message").textContent =
//     `Welcome, ${user.name}`;

//   document.getElementById("profile-email").textContent = user.email;

//   /* =====================
//      CREDITS (SAFE FALLBACKS)
//      ===================== */
//   const credits = user.credits || {};

//   setText("credits-available", credits.available ?? credits ?? 0);
//   setText("credits-earned", credits.earned ?? 0);
//   setText("credits-spent", credits.spent ?? 0);

//   /* =====================
//      SKILLS SECTIONS
//      ===================== */
//   renderSkills("skills-teach-list", user.skillsTeach);
//   renderSkills("skills-learning-list", user.skillsLearning);
//   renderSkills("skills-interested-list", user.skillsInterested);

//   /* =====================
//      ACTIVITY
//      ===================== */
//   renderActivity(user.activity);
// });

// /* =====================
//    HELPERS
//    ===================== */

// function setText(id, value) {
//   const el = document.getElementById(id);
//   if (el) el.textContent = value;
// }

// function renderSkills(containerId, skills) {
//   const container = document.getElementById(containerId);
//   if (!container) return;

//   container.innerHTML = "";

//   if (!skills || skills.length === 0) {
//     container.innerHTML = "<p>No data available.</p>";
//     return;
//   }

//   skills.forEach(skill => {
//     const span = document.createElement("span");
//     span.className = "skill-tag";
//     span.textContent = skill;
//     container.appendChild(span);
//   });
// }

// function renderActivity(activity) {
//   const list = document.getElementById("activity-list");
//   if (!list) return;

//   list.innerHTML = "";

//   if (!activity || activity.length === 0) {
//     list.innerHTML = "<li>No recent activity.</li>";
//     return;
//   }

//   activity.forEach(item => {
//     const li = document.createElement("li");
//     li.textContent = item;
//     list.appendChild(li);
//   });
// }

// console.log("PROFILE TOKEN:", localStorage.getItem("token"));

// document.addEventListener("DOMContentLoaded", async () => {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     window.location.href = "login.html";
//     return;
//   }

//   try {
//     const res = await fetch("http://localhost:5000/api/profile/me", {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });

//     if (!res.ok) throw new Error();

//     const user = await res.json();

//         // Basic info
//     const welcomeEl = document.getElementById("welcome-message");
//     if (welcomeEl) {
//       welcomeEl.textContent = `Welcome, ${user.name}`;
//     }

//     const emailEl = document.getElementById("profile-email");
//     if (emailEl) {
//       emailEl.textContent = user.email;
//     }

//     // Credit dashboard (FIXED)
//     const credits = user.credits || {};

//     const availableEl = document.getElementById("credits-available");
//     if (availableEl) {
//       availableEl.textContent = credits.available ?? 0;
//     }

//     const earnedEl = document.getElementById("credits-earned");
//     if (earnedEl) {
//       earnedEl.textContent = credits.earned ?? 0;
//     }

//     const spentEl = document.getElementById("credits-spent");
//     if (spentEl) {
//       spentEl.textContent = credits.spent ?? 0;
//     }


//   }catch (err) {
//   console.error("PROFILE FETCH FAILED:", err);
//   alert("Profile API failed — check console");
// }

// });




document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const user = await res.json();

    /* =====================
       BASIC INFO
       ===================== */
    setText("welcome-message", `Welcome, ${user.name}`);
    setText("profile-email", user.email);

    /* =====================
       CREDITS & STATS
       ===================== */
    const credits = user.credits || {};
    setText("credits-available", credits.available ?? 0);
    setText("credits-earned", credits.earned ?? 0);
    // setText("credits-spent", credits.spent ?? 0); // Removed or not needed in summary

    // Counts
    setText("teaching-count", user.skillsTeach ? user.skillsTeach.length : 0);
    setText("learning-count", user.skillsCompleted ? user.skillsCompleted.length : 0); // Or use learning list?

    // Bio (if available in user object)
    if (user.bio) setText("userBio", user.bio);
    else setText("userBio", "Ready to learn and teach.");

    /* =====================
       SKILLS SECTIONS
       ===================== */
    /* =====================
       SKILLS SECTIONS
       ===================== */
    // Fetch detailed skills map to get IDs and Quiz IDs
    let allSkillsMap = {};
    try {
      const skillRes = await fetch("http://localhost:5000/api/skills", { headers: { Authorization: `Bearer ${token}` } });
      const skillsData = await skillRes.json();
      skillsData.forEach(s => allSkillsMap[s.name] = s);
    } catch (e) { console.error("Failed to load skills map"); }

    renderSkills("user-teaching", user.skillsTeach, allSkillsMap, false);
    renderSkills("user-learning", user.skillsLearning, allSkillsMap, true); // Enable Quiz
    renderSkills("user-interests", user.skillsInterested, allSkillsMap, false);

    /* =====================
       ACTIVITY
       ===================== */
    renderActivity("user-activity", user.activity);

    // ===================================
    // QUIZ LOGIC
    // ===================================
    window.openQuiz = async (skillName) => {
      const skill = allSkillsMap[skillName];
      if (!skill || !skill.quizId) {
        alert("No quiz available for this skill yet.");
        return;
      }

      const modal = document.getElementById("quizModal");
      const title = document.getElementById("quizTitle");
      const container = document.getElementById("quizQuestions");
      const resultDiv = document.getElementById("quizResult");
      const submitBtn = document.getElementById("submitQuizBtn");

      // Reset
      container.innerHTML = "Generating your unique quiz session...";
      resultDiv.style.display = "none";
      submitBtn.style.display = "none"; // Hide until loaded
      modal.style.display = "flex";
      currentQuizId = skill.quizId;
      currentSkillName = skillName;

      try {
        const res = await fetch(`http://localhost:5000/api/protected/quiz/${skill.quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const quiz = await res.json();

        if (res.status === 403) {
          container.innerHTML = `<h3 style="color: var(--danger)">Max Attempts Reached</h3><p>${quiz.msg}</p>`;
          return;
        }

        title.textContent = quiz.title; // Includes attempt #
        container.innerHTML = "";

        // Show Attempt Info
        const info = document.createElement("div");
        info.style.cssText = "background: #333; padding: 8px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9rem;";
        info.innerHTML = `<strong>Attempt:</strong> ${quiz.attempts + 1} / ${quiz.maxAttempts} <br> <strong>Difficulty:</strong> Increases with each attempt`;
        container.appendChild(info);

        quiz.questions.forEach((q, idx) => {
          const qDiv = document.createElement("div");
          qDiv.className = "mb-4";
          qDiv.innerHTML = `
                    <p style="margin-bottom: 8px;"><strong>${idx + 1}. ${q.questionText}</strong></p>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        ${q.options.map((opt, i) => `
                            <label style="cursor: pointer;">
                                <input type="radio" name="q${idx}" value="${i}"> ${opt}
                            </label>
                        `).join("")}
                    </div>
                `;
          container.appendChild(qDiv);
        });

        submitBtn.style.display = "block";

      } catch (err) {
        container.innerHTML = "Error loading quiz.";
      }
    };

    let currentQuizId = null;
    let currentSkillName = null;

    document.getElementById("submitQuizBtn").addEventListener("click", async () => {
      // Gather answers
      const container = document.getElementById("quizQuestions");
      // We have to select inputs carefully because we added an info div
      const questionsDivs = container.querySelectorAll("div.mb-4");
      // Or just iterate using index if we trust the loop count from 'questions' in memory? 
      // Safest is to just loop N times. We don't have N here easily unless we store it.
      // Let's use the input names q0, q1... to find how many.

      const answers = {};
      let qCount = 0;

      // Find how many questions by checking q0, q1...
      while (container.querySelector(`input[name="q${qCount}"]`)) {
        const selected = container.querySelector(`input[name="q${qCount}"]:checked`);
        if (selected) {
          answers[qCount] = [parseInt(selected.value)];
        } else {
          answers[qCount] = [];
        }
        qCount++;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/protected/quiz/${currentQuizId}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ answers })
        });
        const result = await res.json();

        const resultDiv = document.getElementById("quizResult");
        const submitBtn = document.getElementById("submitQuizBtn");
        const qContainer = document.getElementById("quizQuestions");

        qContainer.style.display = "none";
        submitBtn.style.display = "none";
        resultDiv.style.display = "block";

        let msg = "";
        let color = "var(--danger)";

        if (result.passed) {
          msg = "PASSED!";
          color = "var(--success)";
        } else {
          msg = "Attempt Failed";
        }

        resultDiv.innerHTML = `
                <h3 style="color: ${color}">${msg}</h3>
                <p>Score: ${result.score}/${result.total} (${result.percentage.toFixed(0)}%)</p>
                <p>Attempt: ${result.attempts} / ${result.maxAttempts}</p>
                <p>Best Score: ${result.bestScore ? result.bestScore.toFixed(0) : 0}%</p>
                
                ${result.passed ?
            `<p>You have mastered this skill!</p> 
                     <button class="btn btn-primary" onclick="claimCertificate('${currentSkillName}')" style="margin-top: 15px;">📄 Download Certificate</button>`
            :
            `<p>You need 60% to pass.</p>
                     ${result.remainingAttempts > 0 ? `<button class="btn btn-secondary" onclick="closeQuizModal()">Try Again (${result.remainingAttempts} left)</button>` : `<p style="color:red">No attempts left.</p>`}
                    `
          }
                
                <br><br>
                <button class="btn btn-secondary" onclick="closeQuizModal()">Close</button>
            `;

      } catch (err) {
        console.error(err);
        alert("Error submitting quiz");
      }
    });

    window.closeQuizModal = () => {
      document.getElementById("quizModal").style.display = "none";
      document.getElementById("quizQuestions").style.display = "block"; // Reset view
      location.reload(); // Refresh to update "Completed" status if passed
    };

    window.claimCertificate = async (skillName) => {
      try {
        const res = await fetch("http://localhost:5000/api/protected/certificate/issue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ skillName })
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Certificate-${skillName}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          // Try to parse error message
          let errMsg = "Unknown Error";
          try {
            const d = await res.json();
            errMsg = d.msg || d.error || JSON.stringify(d);
          } catch (parseErr) {
            errMsg = await res.text(); // Fallback if not JSON
          }
          console.error("Certificate Download Error:", errMsg);
          alert(`Download failed: ${errMsg}`);
        }
      } catch (e) {
        console.error(e);
        alert("Download failed - Network or Server Error");
      }
    };

    // DELETE ACCOUNT LOGIC
    const deleteBtn = document.getElementById("delete-account-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/profile", {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              alert("Account deleted.");
              localStorage.removeItem("token");
              window.location.href = "login.html";
            } else {
              const data = await res.json();
              alert(data.msg || "Delete failed");
            }
          } catch (err) {
            console.error(err);
            alert("Error deleting account");
          }
        }
      });
    }

  } catch (err) {
    console.error("PROFILE FETCH FAILED:", err);
    if (err.message === "Unauthorized") {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
    } else {
      alert(`Profile API failed: ${err.message}`);
    }
  }
});

/* =====================
   HELPERS
   ===================== */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderSkills(containerId, skillNamesList, skillMap = {}, isLearning = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!skillNamesList || skillNamesList.length === 0) {
    container.innerHTML = "<p style='color: #888;'>None yet.</p>";
    return;
  }

  skillNamesList.forEach(name => {
    const div = document.createElement("div");
    div.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #262626; padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #333;";

    const span = document.createElement("span");
    span.textContent = name;

    div.appendChild(span);

    // If it's the "Learning" list, add Actions
    if (isLearning) {
      const fullSkill = skillMap[name];
      if (fullSkill) {
        // Check if user already completed it? (We don't have completed list in local 'user' var here unless we reload or check updated field)
        // But we can just show "Take Quiz" or "Certificate" if we knew.
        // For now, simpler: "Take Quiz" always available.
        const btn = document.createElement("button");
        btn.className = "btn btn-sm btn-primary";
        btn.textContent = "Take Quiz 📝";

        // Use quizId if available
        if (fullSkill.quizId) {
          btn.onclick = () => {
            window.location.href = `quiz_take.html?id=${fullSkill.quizId}`;
          };
        } else {
          btn.onclick = () => alert("Quiz not ready for this skill yet.");
        }

        div.appendChild(btn);
      }
    }

    container.appendChild(div);
  });
}

function renderActivity(containerId, activity) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!activity || activity.length === 0) {
    container.innerHTML = "<li>No recent activity.</li>";
    return;
  }

  activity.slice().reverse().forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    container.appendChild(li);
  });
}
