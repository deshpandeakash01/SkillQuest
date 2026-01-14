const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Quiz = require('./models/Quiz');

// Mock req/res for controller testing
const mockRes = () => {
    const res = {};
    res.json = (data) => { res.data = data; return res; };
    res.status = (code) => { res.statusCode = code; return res; };
    return res;
};

async function runTest() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        // 1. Create User
        const user = await User.create({
            name: "Delete Tester",
            email: `deletetest_${Date.now()}@test.com`,
            password: "password"
        });
        console.log("Created User:", user._id);

        // 2. Create Dummy Video File
        const videoPath = path.join(__dirname, 'uploads', `testvideo_${user._id}.mp4`);
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
        fs.writeFileSync(videoPath, "dummy content");
        console.log("Created Dummy Video:", videoPath);

        // 3. Create Skill
        const skill = await Skill.create({
            name: "Test Delete Skill",
            outcome: "Testing Deletion",
            createdBy: user._id,
            videoUrl: `/uploads/testvideo_${user._id}.mp4`
        });
        console.log("Created Skill:", skill._id);

        // 4. Run Deletion Logic (Simulating Controller)
        // We import the controller function and run it
        const { deleteAccount } = require('./controllers/profileController');

        const req = { user: { id: user._id } };
        const res = mockRes();

        console.log("... Running Delete Account ...");
        await deleteAccount(req, res);

        console.log("Delete Response:", res.data || res.statusCode);

        // 5. Verify Deletion
        const userCheck = await User.findById(user._id);
        const skillCheck = await Skill.findById(skill._id);
        const videoCheck = fs.existsSync(videoPath);

        console.log("\n--- VERIFICATION RESULTS ---");
        console.log("User Exists:", !!userCheck);
        console.log("Skill Exists:", !!skillCheck);
        console.log("Video Exists:", videoCheck);

        if (!userCheck && !skillCheck && !videoCheck) {
            console.log("SUCCESS: Everything deleted.");
        } else {
            console.log("FAILURE: Some items persist.");
        }

        mongoose.connection.close();

    } catch (err) {
        console.error("TEST ERROR:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

runTest();
