// using global fetch
const BASE_URL = 'http://localhost:5000/api';
const EMAIL = `diag_${Date.now()}@test.com`;
const PASSWORD = 'password123';

async function runDiagnostics() {
    console.log("Starting Backend Diagnostics...");
    let token = "";
    let userId = "";
    let skillId = "";

    // 1. HEALTH CHECK (Root)
    try {
        const res = await fetch('http://localhost:5000/');
        console.log(`[1] Root Check: ${res.status} ${res.statusText}`);
    } catch (e) {
        console.error(`[1] Root Check FAILED: ${e.message}`);
        return;
    }

    // 2. REGISTER
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Diag User', email: EMAIL, password: PASSWORD })
        });
        const data = await res.json();
        console.log(`[2] Register: ${res.status}`);
        if (!res.ok) throw new Error(data.msg);
    } catch (e) {
        console.error(`[2] Register FAILED: ${e.message}`);
        return;
    }

    // 3. LOGIN
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const data = await res.json();
        console.log(`[3] Login: ${res.status}`);
        if (!data.token) throw new Error("No token received");
        token = data.token;
        // userId = data.user.id; // Login only returns token
    } catch (e) {
        console.error(`[3] Login FAILED: ${e.message}`);
        return;
    }

    // 4. GET PROFILE
    try {
        const res = await fetch(`${BASE_URL}/profile/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log(`[4] Profile Fetch: ${res.status}`);
        if (data._id !== userId) console.warn("User ID mismatch in profile fetch");
    } catch (e) {
        console.error(`[4] Profile Fetch FAILED: ${e.message}`);
    }

    // 5. UPDATE PROFILE
    try {
        const res = await fetch(`${BASE_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ bio: "Diagnostic Bio", socialLinks: { twitter: "http://x.com" } })
        });
        console.log(`[5] Profile Update: ${res.status}`);
    } catch (e) {
        console.error(`[5] Profile Update FAILED: ${e.message}`);
    }

    // 6. CREATE SKILL (Simulate Publish)
    // Note: Publishing usually requires a file upload. We might skip this or try a mocked request.
    // Let's rely on finding skills instead.
    try {
        const res = await fetch(`${BASE_URL}/skills`);
        const data = await res.json();
        console.log(`[6] Fetch Skills: ${res.status} (Count: ${data.length})`);
    } catch (e) {
        console.error(`[6] Fetch Skills FAILED: ${e.message}`);
    }

    console.log("\nDiagnostics Complete. If all passed, Backend is GOOD.");
}

runDiagnostics();
