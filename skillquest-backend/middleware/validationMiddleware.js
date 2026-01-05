const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Email regex validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: "Please enter a valid email address" });
    }

    if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    next();
};

module.exports = { validateRegister };
