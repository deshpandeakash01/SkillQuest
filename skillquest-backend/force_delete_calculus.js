const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Skill = require('./models/Skill');
const Quiz = require('./models/Quiz');

async function forceDeleteCalculus() {
    try {
        // Use 127.0.0.1 to avoid ipv6 issues if any
        await mongoose.connect('mongodb://127.0.0.1:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        const skillNameQuery = "essence of calculus";

        // Find the skill
        const skill = await Skill.findOne({ name: { $regex: new RegExp(skillNameQuery, "i") } });

        if (!skill) {
            console.log(`\n❌ Skill matching "${skillNameQuery}" NOT FOUND.`);
        } else {
            console.log(`\n✅ Found Skill: "${skill.name}" (ID: ${skill._id})`);

            // Delete Video
            if (skill.videoUrl && !skill.videoUrl.startsWith("http")) {
                const relativePath = skill.videoUrl.startsWith("/") ? skill.videoUrl.substring(1) : skill.videoUrl;
                const filePath = path.join(__dirname, relativePath);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`   Deleted Video File: ${relativePath}`);
                }
            }

            // Delete Quiz
            if (skill.quizId) {
                await Quiz.findByIdAndDelete(skill.quizId);
                console.log(`   Deleted Associated Quiz`);
            }

            // Delete Skill
            await Skill.findByIdAndDelete(skill._id);
            console.log(`   Deleted Skill Record.`);

            console.log("\nSuccess: 'Essence of Calculus' manually removed.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

forceDeleteCalculus();
