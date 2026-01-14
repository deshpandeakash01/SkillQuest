document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const toast = document.getElementById("toast");

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.borderLeftColor = isError ? "var(--error)" : "var(--success)";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      showToast("Login successful!");
      setTimeout(() => window.location.href = "profile.html", 1000);
    } else {
      showToast(data.msg || "Login failed", true);
    }
  } catch (err) {
    console.error(err);
    showToast("Server error", true);
  }
});
