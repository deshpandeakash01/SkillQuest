const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Skill = require('./models/Skill');

async function runCleanup() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        // 1. Collect all valid filenames
        const validFiles = new Set();

        const skills = await Skill.find({});
        skills.forEach(skill => {
            if (skill.videoUrl && skill.videoUrl.startsWith("/uploads/")) {
                const filename = skill.videoUrl.replace("/uploads/", "");
                validFiles.add(filename);
            }
        });

        const users = await User.find({});
        users.forEach(user => {
            if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
                const filename = user.profilePicture.replace("/uploads/", "");
                validFiles.add(filename);
            }
        });

        console.log(`Found ${validFiles.size} valid referenced files in DB.`);

        // 2. Scan uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            console.log("No uploads directory found. Nothing to clean.");
            process.exit(0);
        }

        const filesOnDisk = fs.readdirSync(uploadsDir);
        let deletedCount = 0;

        filesOnDisk.forEach(file => {
            // Skip .gitignore or similar system files if any (optional)
            if (file === ".gitignore") return;

            if (!validFiles.has(file)) {
                // ORPHAN!
                const filePath = path.join(uploadsDir, file);
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted orphan: ${file}`);
                    deletedCount++;
                } catch (e) {
                    console.error(`Failed to delete ${file}:`, e.message);
                }
            }
        });

        console.log(`\nCleanup Complete. Deleted ${deletedCount} orphaned files.`);

        mongoose.connection.close();

    } catch (err) {
        console.error("Cleanup Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

runCleanup();
