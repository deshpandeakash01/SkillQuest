document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // DOM Elements
    const els = {
        name: document.getElementById("userName"),
        bio: document.getElementById("userBio"),
        initials: document.getElementById("avatarInitials"),
        profileImg: document.getElementById("profilePicImg"),
        socialContainer: document.getElementById("socialLinksContainer"),
        rating: document.getElementById("userRating"),
        ratingCount: document.getElementById("ratingCount"),
        balance: document.getElementById("creditBalance"),
        earned: document.getElementById("creditsEarned"),
        teachingCount: document.getElementById("teachingCount"),
        learningCount: document.getElementById("learningCount"),
        teachingList: document.getElementById("teachingList"),
        learningList: document.getElementById("learningList"),
        logoutBtn: document.getElementById("logoutBtn"),

        // Modal
        editBtn: document.getElementById("editProfileBtn"),
        modal: document.getElementById("editProfileModal"),
        closeBtn: document.getElementById("closeModalBtn"),
        form: document.getElementById("editProfileForm"),
        bioInput: document.getElementById("bioInput"),
        picInput: document.getElementById("profilePicInput")
    };

    let currentUserData = null;

    // Load Profile
    try {
        const res = await fetch("/api/profile/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        currentUserData = await res.json();
        renderProfile(currentUserData);

    } catch (err) {
        console.error(err);
        alert("Error loading profile");
    }

    els.logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // Modal Elements (New)
    const modalEls = {
        changePhotoBtn: document.getElementById("btnChangePhoto"),
        removePhotoBtn: document.getElementById("btnRemovePhoto"),
        modalPreview: document.getElementById("modalProfilePreview")
    };

    // Modal Interaction
    els.editBtn.addEventListener("click", () => {
        els.modal.style.display = "flex";

        // Pre-fill
        if (currentUserData) {
            els.bioInput.value = currentUserData.bio || "";
            // Fill social links if mapped
            const links = currentUserData.socialLinks || {};
            const inputs = els.form.querySelectorAll("input[type='url']");
            inputs.forEach(inp => {
                const key = inp.name;
                if (links[key]) inp.value = links[key];
                else inp.value = "";
            });

            // Picture Logic for Modal
            if (currentUserData.profilePicture) {
                modalEls.modalPreview.src = currentUserData.profilePicture;
                modalEls.removePhotoBtn.style.display = 'block';
            } else {
                modalEls.modalPreview.src = "https://via.placeholder.com/80?text=U"; // Fallback
                modalEls.removePhotoBtn.style.display = 'none';
            }
        }
    });

    els.closeBtn.addEventListener("click", () => {
        els.modal.style.display = "none";
    });

    // Change Photo Click
    modalEls.changePhotoBtn.addEventListener("click", () => {
        els.picInput.click();
    });

    // On File Select
    els.picInput.addEventListener("change", () => {
        if (els.picInput.files && els.picInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalEls.modalPreview.src = e.target.result;
            }
            reader.readAsDataURL(els.picInput.files[0]);
        }
    });

    // Remove Photo Click
    modalEls.removePhotoBtn.addEventListener("click", async () => {
        if (!confirm("Remove current profile photo?")) return;

        try {
            const res = await fetch("/api/protected/profile/picture", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Photo removed.");
                modalEls.modalPreview.src = "https://via.placeholder.com/80?text=U";
                modalEls.removePhotoBtn.style.display = 'none';

                // Update Main UI immediately
                els.profileImg.src = "";
                els.profileImg.style.display = "none";
                els.initials.style.display = "block";

                // Refresh data
                const userDataRes = await fetch("/api/profile/me", { headers: { "Authorization": `Bearer ${token}` } });
                currentUserData = await userDataRes.json();
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Form Submit
    els.form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Upload Image if present
        if (els.picInput.files[0]) {
            const formData = new FormData();
            formData.append("image", els.picInput.files[0]);

            try {
                await fetch("/api/protected/profile/picture", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });
            } catch (err) {
                console.error("Image upload failed", err);
            }
        }

        // 2. Update Bio & Links
        const payload = {
            bio: els.bioInput.value,
            socialLinks: {}
        };

        const inputs = els.form.querySelectorAll("input[type='url']");
        inputs.forEach(inp => {
            if (inp.value.trim()) {
                payload.socialLinks[inp.name] = inp.value.trim();
            }
        });

        try {
            const res = await fetch("/api/protected/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                if (data.bonusEarned > 0) {
                    alert(`Profile Updated! You earned +${data.bonusEarned} Bonus Credits!`);
                } else {
                    alert("Profile Updated!");
                }
                location.reload();
            } else {
                alert("Update failed: " + data.msg);
            }

        } catch (err) {
            console.error(err);
            alert("Error updating profile");
        }
    });

    function renderProfile(user) {
        // Header
        els.name.textContent = user.name;
        els.bio.textContent = user.bio || "No bio available.";

        // Picture Logic
        if (user.profilePicture) {
            els.profileImg.src = user.profilePicture;
            els.profileImg.style.display = "block";
            els.initials.style.display = "none";
        } else {
            els.initials.textContent = user.name.charAt(0).toUpperCase();
            els.profileImg.style.display = "none";
            els.initials.style.display = "block";
        }

        // Social Links
        els.socialContainer.innerHTML = "";
        const links = user.socialLinks || {};
        for (const [platform, url] of Object.entries(links)) {
            // Check if map or object (mongoose map returns object in JSON usually)
            // Handle if map was not converted 
        }
        // In fetch JSON, Mongoose Map becomes plain object { github: "url", ...}
        for (const key in links) {
            if (links[key]) {
                const a = document.createElement("a");
                a.href = links[key];
                a.target = "_blank";
                a.style.color = "var(--primary)";
                a.style.fontSize = "1.5rem";
                a.title = key;

                // Icons mappings (simple chars or FontAwesome if installed, using Emoji for now/Icons)
                let icon = "🔗";
                if (key === "github") icon = "💻";
                if (key === "linkedin") icon = "👔";
                if (key === "instagram") icon = "📸";
                if (key === "twitter") icon = "🐦";
                if (key === "leetcode") icon = "🧠";
                if (key === "discord") icon = "💬";

                a.innerHTML = icon;
                els.socialContainer.appendChild(a);
            }
        }

        const ratingVal = user.rating || 0;
        els.rating.textContent = `${ratingVal.toFixed(1)} ★`;
        els.ratingCount.textContent = `(${user.ratingCount || 0} reviews)`;

        // Stats
        const credits = user.credits || {};
        els.balance.textContent = credits.available || 0;
        els.earned.textContent = credits.earned || 0;
        els.teachingCount.textContent = user.skillsTeach?.length || 0;
        els.learningCount.textContent = user.skillsLearning?.length || 0;

        // Lists
        if (user.skillsTeach.length > 0) {
            els.teachingList.innerHTML = user.skillsTeach.map(skillName => `
        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 500;">${skillName}</span>
          <span class="badge badge-primary">Teacher</span>
        </div>
      `).join("");
        }

        if (user.skillsLearning.length > 0) {
            els.learningList.innerHTML = user.skillsLearning.map(skillName => `
        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>${skillName}</span>
          <span class="badge badge-green">In Progress</span>
        </div>
      `).join("");
        }
    }
});
