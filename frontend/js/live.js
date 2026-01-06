/* =========================================
   LIVE STREAM & RECORDING LOGIC
   ========================================= */

const myPeerIdInput = document.getElementById("myPeerId");
const remotePeerIdInput = document.getElementById("remotePeerId");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Controls
const btnJoin = document.getElementById("btnJoin");
const btnToggleCam = document.getElementById("btnToggleCam");
const btnToggleMic = document.getElementById("btnToggleMic");
const btnStartRecord = document.getElementById("btnStartRecord");
const btnStopRecord = document.getElementById("btnStopRecord");
const btnUploadVideo = document.getElementById("btnUploadVideo");
const videoUploadInput = document.getElementById("videoUploadInput");

// AI Notes
const aiNotesPlaceholder = document.getElementById("aiNotesPlaceholder");

// PeerJS
let peer;
let localStream;
let remoteStream;

// Recording
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

// Token
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
} else {
    // Verify token validity quickly
    fetch("http://localhost:5000/api/profile/me", { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => {
            if (res.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
            }
        });
}

/* ===========================
   INIT
   =========================== */
async function init() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Init Peer
        peer = new Peer();

        peer.on("open", (id) => {
            myPeerIdInput.value = id;
            updateStatus("Online - Waiting for connection");
        });

        // Answer call
        peer.on("call", (call) => {
            if (confirm("Incoming class request. Accept?")) {
                currentCall = call;
                call.answer(localStream);
                handleStream(call);
            }
        });

    } catch (err) {
        console.error("Camera access failed", err);
        alert("Camera/Mic access required.");
    }
}

let currentCall = null;
const btnShareScreen = document.getElementById("btnShareScreen");
let screenStream = null;

btnShareScreen.addEventListener("click", async () => {
    if (!screenStream) {
        // Start Sharing
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            // If connected, replace track
            if (currentCall && currentCall.peerConnection) {
                const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === "video");
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            }

            // Show on local
            localVideo.srcObject = screenStream;
            btnShareScreen.textContent = "Stop Sharing";
            btnShareScreen.classList.add("btn-error"); // Visual cue

            // Handle stop via browser UI
            screenTrack.onended = stopSharingScreen;

        } catch (err) {
            console.error("Screen share failed", err);
        }
    } else {
        stopSharingScreen();
    }
});

function stopSharingScreen() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }

    // Switch back to camera
    const videoTrack = localStream.getVideoTracks()[0];
    if (currentCall && currentCall.peerConnection) {
        const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
    }

    localVideo.srcObject = localStream;
    btnShareScreen.textContent = "🖥️ Share Screen";
    btnShareScreen.classList.remove("btn-error");
}

function handleStream(call) {
    currentCall = call;
    call.on("stream", (stream) => {
        remoteVideo.srcObject = stream;
        remoteVideo.style.display = "block";
        remoteStream = stream;
        updateStatus("Connected to Class");
    });
}

function updateStatus(msg) {
    document.getElementById("statusBadge").textContent = msg;
}

/* ===========================
   CALL LOGIC
   =========================== */
btnJoin.addEventListener("click", () => {
    const peerId = remotePeerIdInput.value.trim();
    if (!peerId) return alert("Enter Teacher ID");

    updateStatus("Connecting...");
    const call = peer.call(peerId, localStream);
    currentCall = call;
    handleStream(call);
});



/* ===========================
   CAMERA & MIC CONTROLS
   =========================== */
btnToggleCam.addEventListener("click", () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            btnToggleCam.textContent = videoTrack.enabled ? "Turn Off Cam" : "Turn On Cam";
            btnToggleCam.classList.toggle("btn-secondary", videoTrack.enabled);
            btnToggleCam.classList.toggle("btn-error", !videoTrack.enabled);
        }
    }
});

btnToggleMic.addEventListener("click", () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            btnToggleMic.textContent = audioTrack.enabled ? "Mute Mic" : "Unmute Mic";
            btnToggleMic.classList.toggle("btn-secondary", audioTrack.enabled);
            btnToggleMic.classList.toggle("btn-error", !audioTrack.enabled);
        }
    }
});

/* ===========================
   RECORDING LOGIC
   =========================== */
btnStartRecord.addEventListener("click", () => {
    if (!localStream) return alert("No stream to record");

    // Record local stream (and preferably remote too if mixed, but defaulting to local for MVP)
    mediaRecorder = new MediaRecorder(localStream);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = uploadRecording;

    mediaRecorder.start();
    isRecording = true;

    btnStartRecord.style.display = "none";
    btnStopRecord.style.display = "inline-flex";

    startTimer();
});

btnStopRecord.addEventListener("click", () => {
    mediaRecorder.stop();
    isRecording = false;
    btnStartRecord.style.display = "inline-flex";
    btnStopRecord.style.display = "none";
    stopTimer();
});


/* ===========================
   FILE UPLOAD LOGIC (NEW)
   =========================== */
videoUploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reuse the upload logic but with a direct File object
    uploadFile(file);
});


/* ===========================
   UPLOAD & AI PROCESSING
   =========================== */
async function uploadRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const file = new File([blob], "class-recording.webm", { type: "video/webm" });
    uploadFile(file);
}

// New Publish Logic
const btnConfirmPublish = document.getElementById("btnConfirmPublish");

btnConfirmPublish.addEventListener("click", async () => {
    const title = document.getElementById("skillTitleInput").value;
    const category = document.getElementById("skillCategoryInput").value;
    const outcome = document.getElementById("skillOutcomeInput").value;
    const fileInput = document.getElementById("videoFileInput");
    const file = fileInput.files[0];

    if (!title || !outcome || !file) {
        return alert("Please fill all fields and select a video.");
    }

    const modal = document.getElementById("uploadModal");
    const progress = document.getElementById("uploadProgress");
    const progressContainer = document.getElementById("progressContainer");

    alert(`Debug: Details - Title: ${title}, Outcome: ${outcome}, File: ${file ? file.name : "None"}`);

    progressContainer.style.display = "block";
    progress.style.width = "30%";

    const quizDiff = document.getElementById("quizDifficultyInput").value;
    const quizNum = document.getElementById("quizNumInput").value;

    const formData = new FormData();
    formData.append("name", title);
    formData.append("category", category);
    formData.append("outcome", outcome);
    formData.append("creditCost", 5); // Default
    formData.append("quizDifficulty", quizDiff);
    formData.append("quizNumQuestions", quizNum);
    formData.append("video", file);

    try {
        const res = await fetch("http://localhost:5000/api/protected/skills/publish", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        progress.style.width = "100%";

        if (res.ok) {
            alert("Skill Published Successfully!");
            modal.style.display = "none";
            // Clean up
            document.getElementById("skillTitleInput").value = "";
            document.getElementById("skillOutcomeInput").value = "";
            fileInput.value = "";
            // Maybe show AI notes if backend generated them, but for now we focus on Publish
        } else {
            alert("Publish Failed: " + data.msg);
        }
    } catch (err) {
        console.error(err);
        alert("Error publishing skill");
    }
});

// Deprecated old Upload logic hooks (can keep for compatibility or remove)
// Leaving empty to prevent errors if invoked
async function uploadRecording() {
    alert("Please save recording locally and publish via 'Publish/Upload' button.");
}
async function uploadFile(file) {
    if (!file) return;

    // Show Progress
    const placeholder = document.getElementById("aiNotesPlaceholder");
    placeholder.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <div class="loader" style="margin: 0 auto 15px;"></div>
            <h4 style="color: var(--secondary); margin-bottom: 5px;">Uploading & analyzing...</h4>
            <p style="color: #666; font-size: 0.9rem;">Please wait while our AI processes your video.</p>
        </div>
        <style>
            .loader {
                border: 4px solid #333;
                border-top: 4px solid var(--primary);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;

    const formData = new FormData();
    formData.append("video", file);

    try {
        // 1. Upload
        const uploadRes = await fetch("http://localhost:5000/api/protected/video/upload", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(uploadData.msg || "Upload failed");

        // 2. Generate Notes
        const notesRes = await fetch("http://localhost:5000/api/protected/video/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ filename: uploadData.filename })
        });
        const notesData = await notesRes.json();

        if (!notesRes.ok) throw new Error(notesData.msg || "Notes generation failed");

        // 3. Display
        displayAiNotes(notesData.downloadUrl);

    } catch (err) {
        console.error(err);
        placeholder.innerHTML = `
            <div style="text-align: center; color: var(--error);">
                <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                <h4>Process Failed</h4>
                <p>${err.message}</p>
                <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: 10px;">Try Again</button>
            </div>
        `;
    }
}


function displayAiNotes(url) {
    const placeholder = document.getElementById("aiNotesPlaceholder");
    placeholder.style.borderColor = "var(--success)";
    placeholder.style.background = "linear-gradient(135deg, rgba(20, 30, 20, 1) 0%, rgba(0,0,0,1) 100%)";

    placeholder.innerHTML = `
        <div style="opacity: 0; animation: fadeIn 0.5s forwards; width: 100%;">
            <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
            <h4 style="color: var(--success); margin-bottom: 5px;">Analysis Complete</h4>
            <p style="color: #bbb; font-size: 0.9rem; margin-bottom: 20px;">
                Your enhanced class notes with summary, key concepts, and resources are ready.
            </p>
            
            <a href="${url}" target="_blank" class="btn btn-primary" 
               style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);">
               <span>📄</span> Download Smart Notes PDF
            </a>

            <div style="margin-top: 15px; font-size: 0.8rem; color: #555;">
                Includes: Executive Summary • Key Concepts • Wiki/GFG Links
            </div>
        </div>
        
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;
}

/* ===========================
   UTILITIES
   =========================== */
let timerInterval;
let seconds = 0;

function startTimer() {
    const timerEl = document.getElementById("timer");
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Start
init();
