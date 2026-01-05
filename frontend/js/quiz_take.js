document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("id");
    const token = localStorage.getItem("token");

    if (!token) window.location.href = "login.html";
    if (!quizId) {
        alert("No quiz specified");
        window.location.href = "index.html";
        return;
    }

    const form = document.getElementById("quizForm");
    const container = document.getElementById("questionsContainer");

    // Load Quiz
    try {
        const res = await fetch(`http://localhost:5000/api/protected/quiz/${quizId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Quiz not found");

        const quiz = await res.json();

        document.getElementById("quizTitle").textContent = quiz.title;
        document.getElementById("quizMeta").textContent = `Created by ${quiz.teacher}`;

        quiz.questions.forEach((q, index) => {
            const card = document.createElement("div");
            card.className = "question-card";

            const typeLabel = q.type === 'multiple' ? '(Select all that apply)' : '';

            let html = `<h3>${index + 1}. ${q.questionText} <span style="font-size:0.8rem; color:#888;">${typeLabel}</span></h3>`;

            q.options.forEach((opt, optIndex) => {
                const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
                html += `
                    <label class="option-label">
                        <input type="${inputType}" name="q_${index}" value="${optIndex}" class="option-input">
                        ${opt}
                    </label>
                `;
            });

            card.innerHTML = html;
            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        alert("Error loading quiz");
    }

    // Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const answers = {};
        const formData = new FormData(form);

        // Group answers
        for (let [key, value] of formData.entries()) {
            const qIndex = key.split('_')[1];
            if (!answers[qIndex]) answers[qIndex] = [];
            answers[qIndex].push(parseInt(value));
        }

        try {
            const res = await fetch(`http://localhost:5000/api/protected/quiz/${quizId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });

            const result = await res.json();

            document.getElementById("resultBox").style.display = "block";
            document.getElementById("scoreVal").textContent = `${result.score} / ${result.total}`;
            window.scrollTo(0, 0);

        } catch (err) {
            console.error(err);
            alert("Submission failed");
        }
    });
});
