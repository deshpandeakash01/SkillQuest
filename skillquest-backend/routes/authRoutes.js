const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { check, validationResult } = require("express-validator");

// Common validation middleware
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array()[0].msg });
    }
    next();
};

router.post("/register", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be 6 or more characters").isLength({ min: 6 })
], validateResult, register);

router.post("/login", [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], validateResult, login);

module.exports = router;