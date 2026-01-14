const mongoose = require('mongoose');
const Skill = require('./models/Skill');
const User = require('./models/User');

async function debugCalculus() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });

        const skillName = "essence of calculus";
        const skill = await Skill.findOne({ name: { $regex: new RegExp(skillName, "i") } });

        if (!skill) {
            console.log(`❌ Skill "${skillName}" NOT FOUND.`);
        } else {
            console.log(`✅ Found Skill: "${skill.name}"`);
            console.log(`   ID: ${skill._id}`);
            console.log(`   CreatedBy: ${skill.createdBy}`);

            if (skill.createdBy) {
                const user = await User.findById(skill.createdBy);
                if (user) {
                    console.log(`   Owner: ${user.name} (${user.email})`);
                } else {
                    console.log(`   ❌ Owner ID exists but User not found (Orphaned User Ref)`);
                }
            } else {
                console.log(`   ❌ No CreatedBy field (Totally Orphaned)`);
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

debugCalculus();
