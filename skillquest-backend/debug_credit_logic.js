const mongoose = require('mongoose');
const User = require('./models/User');

async function debugCreditLogic() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        const email = "deshpandeakash01@gmail.com";
        const user = await User.findOne({ email: email });

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log("--- BEFORE DEDUCTION ---");
        console.log("User ID:", user._id);
        console.log("Credits Object:", JSON.stringify(user.credits, null, 2));
        console.log("Activity (Last 3):", user.activity.slice(-3));

        // Simulate logic
        const oldVal = user.credits.available;
        const newVal = Math.max(0, (user.credits.available || 0) - 5);

        console.log(`\nAttempting Deduction: ${oldVal} -> ${newVal}`);

        user.credits.available = newVal;
        user.activity.push(`Debug Deduction Test ${new Date().toISOString()}`);

        const savedUser = await user.save();

        console.log("\n--- AFTER SAVE ---");
        console.log("Credits Object:", JSON.stringify(savedUser.credits, null, 2));

        if (savedUser.credits.available === newVal) {
            console.log("\n✅ SAVE SUCCESSFUL - Logic works in isolation.");
        } else {
            console.log("\n❌ SAVE FAILED - Value did not persist.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

debugCreditLogic();
