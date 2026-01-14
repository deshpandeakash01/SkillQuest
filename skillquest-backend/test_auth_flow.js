// Node 18+ has global fetch

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runTest() {
    console.log("1. Registering User...");
    try {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: EMAIL, password: PASSWORD })
        });
        const regData = await regRes.json();
        console.log("Register Response:", regRes.status, regData);

        if (!regRes.ok && regRes.status !== 400) return; // 400 might be "already exists"

        console.log("\n2. Logging In...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        console.log("Login Response:", loginRes.status, loginData);

        if (!loginData.token) {
            console.error("No token received!");
            return;
        }

        console.log("\n3. Fetching Profile...");
        const profileRes = await fetch(`${BASE_URL}/profile/me`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const profileData = await profileRes.json();
        console.log("Profile Response:", profileRes.status, profileData);

        if (profileRes.ok) {
            console.log("\nSUCCESS: Auth flow works.");
        } else {
            console.error("\nFAILURE: Profile fetch failed.");
        }

        console.log("\n4. Testing Profile Update (Bio + Socials)...");
        const updateRes = await fetch(`${BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({
                bio: "Updated Bio via Test",
                socialLinks: {
                    github: "https://github.com/test",
                    linkedin: "https://linkedin.com/in/test"
                }
            })
        });
        const updateData = await updateRes.json();
        console.log("Update Response:", updateRes.status, updateData);

    } catch (err) {
        console.error("TEST FAILED:", err);
    }
}

runTest();
