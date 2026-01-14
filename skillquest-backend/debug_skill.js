const mongoose = require('mongoose');
const Skill = require('./models/Skill');
const User = require('./models/User');

async function debugSkill() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        const skillName = "essence of integrals"; // Loose match if needed
        // Find skill (case insensitive regex)
        const skill = await Skill.findOne({ name: { $regex: new RegExp(skillName, "i") } });

        if (!skill) {
            console.log(`Skill "${skillName}" NOT FOUND in Database.`);
        } else {
            console.log("--- SKILL FOUND ---");
            console.log("ID:", skill._id);
            console.log("Name:", skill.name);
            console.log("CreatedBy (User ID):", skill.createdBy);
            console.log("VideoURL:", skill.videoUrl);

            if (skill.createdBy) {
                const user = await User.findById(skill.createdBy);
                console.log("--- AUTHOR CHECK ---");
                if (user) {
                    console.log("User Exists:", user.name, user.email);
                } else {
                    console.log("User DOES NOT EXIST (Orphaned Record).");
                }
            } else {
                console.log("Skill has NO 'createdBy' field.");
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

debugSkill();
