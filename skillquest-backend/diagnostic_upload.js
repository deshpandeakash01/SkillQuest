const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = "deshpandeakash01@gmail.com"; // Use the real user
const PASSWORD = "password123"; // Assuming this is known or I should register a new one. 
// Actually, let's register a temp one to be safe.
const TEMP_EMAIL = `uploader_${Date.now()}@test.com`;

async function runUploadTest() {
    console.log("Starting Upload Diagnostic...");

    // 1. Register/Login
    let token = "";
    try {
        // Register
        await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Upload Tester', email: TEMP_EMAIL, password: PASSWORD })
        });

        // Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEMP_EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginData.token) throw new Error("Login failed");
        token = loginData.token;
        console.log("✅ Authenticated");

    } catch (e) {
        console.error("Auth Failed:", e.message);
        return;
    }

    // 2. Prepare Mock File
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const filename = "test_vid.webm";
    const fileContent = "Fake Video Content " + Date.now();

    // Construct Multipart Body
    let body = "";

    // Field: name
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="name"\r\n\r\n`;
    body += `Test Skill Upload\r\n`;

    // Field: outcome
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="outcome"\r\n\r\n`;
    body += `Testing upload functionality\r\n`;

    // Field: category
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="category"\r\n\r\n`;
    body += `Technical\r\n`;

    // Field: video (file)
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="video"; filename="${filename}"\r\n`;
    body += `Content-Type: video/webm\r\n\r\n`;
    body += `${fileContent}\r\n`;

    // End
    body += `--${boundary}--\r\n`;

    // 3. Upload
    try {
        console.log("🚀 Sending POST /api/skills/publish...");
        const res = await fetch(`${BASE_URL}/skills/publish`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });

        const text = await res.text();
        console.log(`Response Status: ${res.status}`);
        console.log(`Response Body: ${text.substring(0, 200)}...`);

        if (res.ok) {
            console.log("✅ UPLOAD SUCCESSFUL");
        } else {
            console.log("❌ UPLOAD FAILED");
        }

    } catch (e) {
        console.error("Upload Error:", e);
    }
}

runUploadTest();
