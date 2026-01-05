
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");

  /* =====================
     THEME INITIALIZATION
     ===================== */
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    body.classList.add("light");
    body.classList.remove("dark");
    if (toggleBtn) toggleBtn.textContent = "🌙";
  } else {
    body.classList.add("dark");
    body.classList.remove("light");
    if (toggleBtn) toggleBtn.textContent = "☀️";
  }

  /* =====================
     THEME TOGGLE
     ===================== */
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      body.classList.toggle("light");
      body.classList.toggle("dark");

      if (body.classList.contains("light")) {
        localStorage.setItem("theme", "light");
        toggleBtn.textContent = "🌙";
      } else {
        localStorage.setItem("theme", "dark");
        toggleBtn.textContent = "☀️";
      }
    });
  }

  /* =====================
     PARALLAX EFFECT
     ===================== */
  window.addEventListener("scroll", () => {
    const bg = document.querySelector(".parallax-bg");
    if (!bg) return;

    const offset = window.pageYOffset * 0.15;
    bg.style.transform = `translateY(${offset}px)`;
  });
});