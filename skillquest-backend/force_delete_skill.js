const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Skill = require('./models/Skill');
const Quiz = require('./models/Quiz');

async function forceDeleteSkill() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        const skillNameQuery = "essence of integrals";

        // Find the skill
        const skill = await Skill.findOne({ name: { $regex: new RegExp(skillNameQuery, "i") } });

        if (!skill) {
            console.log(`\n❌ Skill matching "${skillNameQuery}" NOT FOUND.`);
        } else {
            console.log(`\n✅ Found Skill: "${skill.name}" (ID: ${skill._id})`);

            // 1. Delete Video File
            if (skill.videoUrl && !skill.videoUrl.startsWith("http")) {
                const relativePath = skill.videoUrl.startsWith("/") ? skill.videoUrl.substring(1) : skill.videoUrl;
                const filePath = path.join(__dirname, relativePath);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`   Deleted Video File: ${relativePath}`);
                } else {
                    console.log(`   Video File not found on disk: ${relativePath}`);
                }
            }

            // 2. Delete Quiz
            if (skill.quizId) {
                await Quiz.findByIdAndDelete(skill.quizId);
                console.log(`   Deleted Associated Quiz: ${skill.quizId}`);
            }

            // 3. Delete Skill
            await Skill.findByIdAndDelete(skill._id);
            console.log(`   Deleted Skill Record from DB.`);

            console.log("\nSuccess: Skill manually removed.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

forceDeleteSkill();
