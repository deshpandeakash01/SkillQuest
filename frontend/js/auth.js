// document.addEventListener("DOMContentLoaded", () => {
//   const token = localStorage.getItem("token");
//   const navLinks = document.querySelector(".nav-links");
//   const heroCtaBtn = document.getElementById("hero-cta-btn");

//   // Some pages may not have navbar
//   if (!navLinks) return;

//   // Reset navbar
//   navLinks.innerHTML = "";

//   // Always-visible links
//   navLinks.insertAdjacentHTML(
//     "beforeend",
//     `
//       <li><a href="index.html#overview">Overview</a></li>
//       <li><a href="skills.html">Share Skill</a></li>
//     `
//   );

//   if (token) {
//     // 🔐 Logged in
//     navLinks.insertAdjacentHTML(
//       "beforeend",
//       `
//         <li><a href="profile.html">Profile</a></li>
//         <li><button id="logout-btn" class="nav-logout-btn">Logout</button></li>
//       `
//     );

//     if (heroCtaBtn) {
//       heroCtaBtn.textContent = "Go to Profile";
//       heroCtaBtn.href = "profile.html";
//     }

//     const logoutBtn = document.getElementById("logout-btn");
//     logoutBtn.addEventListener("click", () => {
//       localStorage.removeItem("token");
//       // localStorage.removeItem("user"); try this
//       alert("Logged out");
//       window.location.href = "index.html";
//     });

//   } else {
//     // 🔓 Logged out
//     navLinks.insertAdjacentHTML(
//       "beforeend",
//       `
//         <li><a href="login.html">Login</a></li>
//         <li><a href="register.html" class="nav-btn">Get Started</a></li>
//       `
//     );

//     if (heroCtaBtn) {
//       heroCtaBtn.textContent = "Get Started";
//       heroCtaBtn.href = "register.html";
//     }
//   }
// });




document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const nav = document.querySelector(".nav-links");
  const heroCtaBtn = document.getElementById("hero-cta-btn");
  if (!nav) return;

  // Common Links
  const marketplaceLink = `<li><a href="skills.html">Marketplace</a></li>`;

  if (token) {
    // 🔐 Logged In View
    nav.innerHTML = `
      ${marketplaceLink}
      <li><a href="live.html">Live Classes</a></li>
      <li><a href="profile.html">Dashboard</a></li>
      <li><button id="logout-btn" class="nav-logout-btn">Logout</button></li>
    `;

    document.getElementById("logout-btn").onclick = () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    }

    if (heroCtaBtn) {
      heroCtaBtn.textContent = "Go to Profile";
      heroCtaBtn.href = "profile.html";
    };
  } else {
    // 🔓 Logged Out View
    nav.innerHTML = `
      ${marketplaceLink}
      <li><a href="index.html#overview">Overview</a></li>
      <li><a href="login.html">Login</a></li>
      <li><a href="register.html" class="nav-btn">Get Started</a></li>
    `;
  }
});
