const mongoose = require('mongoose');
const User = require('./models/User');

async function deductManualCredits() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        // Find the user (assuming single user or find by name/email if known, or get first user)
        // In local dev, usually only one user or we know the email from previous context (deshpandeakash01@gmail.com)
        const user = await User.findOne({ email: "deshpandeakash01@gmail.com" });

        if (!user) {
            console.log("User not found.");
        } else {
            console.log(`Current Credits: ${user.credits.available} | Earned: ${user.credits.earned}`);

            const DEDUCTION = 5;
            const oldBalance = user.credits.available || 0;
            const newBalance = Math.max(0, oldBalance - DEDUCTION);

            if (oldBalance !== newBalance) {
                user.credits.available = newBalance;
                user.activity.push(`Deducted ${DEDUCTION} credits for deleted skill (Manual Adjustment)`);
                await user.save();
                console.log(`✅ Deducted ${DEDUCTION} credits. New Balance: ${newBalance}`);
            } else {
                console.log("Balance already 0 or no deduction needed.");
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

deductManualCredits();
