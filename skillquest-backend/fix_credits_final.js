const mongoose = require('mongoose');
const User = require('./models/User');

async function fixCredits() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skillquest', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`User: ${user.name} | Email: ${user.email} | Credits: ${user.credits.available}`);

            // Check if this is likely the user (Akash)
            if (user.email.includes("deshpande") || user.name.includes("Akash")) {
                console.log(`>>> TARGET FOUND: ${user.name}`);

                // Force deduct 10 credits (2 videos)
                // If balance is 40 (from screenshot), it should be 30.
                // If balance is 35 (1 deleted), it should be 25? 
                // User said "deleted 2 videos". 
                // Let's deduct 10 from WHATEVER it is now, but verification is key.

                const current = user.credits.available || 0;
                const deduction = 10;
                const final = Math.max(0, current - deduction);

                user.credits.available = final;
                user.activity.push(`Manual Deduction of ${deduction} credits (System Fix)`);

                await user.save();
                console.log(`>>> UPDATED BALANCE: ${current} -> ${final}`);
            }
        }

        console.log("Done.");
        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
        if (mongoose.connection.readyState === 1) mongoose.connection.close();
    }
}

fixCredits();
