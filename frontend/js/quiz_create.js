let questions = [];

function addQuestion() {
    const qId = Date.now();
    const qObj = {
        id: qId,
        text: "",
        type: "single",
        options: ["", ""] // Start with 2 empty options
    };
    questions.push(qObj);
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById("questionsList");
    container.innerHTML = "";

    questions.forEach((q, index) => {
        const div = document.createElement("div");
        div.className = "q-block";

        let optionsHtml = "";
        q.options.forEach((opt, optIdx) => {
            optionsHtml += `
                <div class="opt-row">
                    <input type="checkbox" class="correct-check" data-qid="${q.id}" data-oid="${optIdx}" title="Mark as correct">
                    <input type="text" value="${opt}" placeholder="Option ${optIdx + 1}" onchange="updateOption(${q.id}, ${optIdx}, this.value)">
                </div>
            `;
        });

        div.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <input type="text" value="${q.text}" placeholder="Question Text" onchange="updateText(${q.id}, this.value)">
            
            <label>Type: 
                <select onchange="updateType(${q.id}, this.value)" style="padding: 5px;">
                    <option value="single" ${q.type === 'single' ? 'selected' : ''}>Single Correct</option>
                    <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>Multiple Correct</option>
                </select>
            </label>

            <div style="margin-top: 10px;">
                ${optionsHtml}
                <button class="btn-sm btn-secondary" onclick="addOption(${q.id})">+ Add Option</button>
            </div>
            
             <button class="btn-sm" style="background: red; margin-top: 10px;" onclick="removeQuestion(${q.id})">Delete</button>
        `;
        container.appendChild(div);
    });
}

// Data Updaters
function updateText(id, val) {
    const q = questions.find(x => x.id === id);
    if (q) q.text = val;
}

function updateType(id, val) {
    const q = questions.find(x => x.id === id);
    if (q) q.type = val;
}

function updateOption(qId, optIdx, val) {
    const q = questions.find(x => x.id === qId);
    if (q) q.options[optIdx] = val;
}

function addOption(qId) {
    const q = questions.find(x => x.id === qId);
    if (q) {
        q.options.push("");
        renderQuestions();
    }
}

function removeQuestion(id) {
    questions = questions.filter(x => x.id !== id);
    renderQuestions();
}

async function publishQuiz() {
    const title = document.getElementById("quizTitle").value;
    if (!title) return alert("Enter quiz title");
    if (questions.length === 0) return alert("Add at least one question");

    const token = localStorage.getItem("token");
    if (!token) return window.location.href = "login.html";

    // Collect Data
    const payload = {
        title,
        questions: []
    };

    // Scrape DOM for correct answers since we didn't bind them bi-directionally fully
    // or just iterate and match

    // Better: Iterate questions array, but we need to know which checks are checked.
    // Let's grab checks from DOM
    const allChecks = document.querySelectorAll(".correct-check");

    questions.forEach(q => {
        const correctIndices = [];
        // Find checks for this Q
        allChecks.forEach(chk => {
            if (parseInt(chk.dataset.qid) === q.id && chk.checked) {
                correctIndices.push(parseInt(chk.dataset.oid));
            }
        });

        payload.questions.push({
            questionText: q.text,
            options: q.options,
            type: q.type,
            correctAnswers: correctIndices
        });
    });

    try {
        const res = await fetch("http://localhost:5000/api/protected/quiz/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            document.getElementById("createFormArea").style.display = "none";
            document.getElementById("successBox").style.display = "block";
            document.getElementById("shareLink").value = `http://localhost:5000/quiz_take.html?id=${data.quizId}`;
        } else {
            alert("Failed: " + data.msg);
        }

    } catch (err) {
        console.error(err);
        alert("Error publishing quiz");
    }
}

// Init
addQuestion();
