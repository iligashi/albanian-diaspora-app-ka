const express = require("express")
const { body } = require("express-validator")
const { auth } = require("../middleware/auth")
const { register, login, getProfile, updateProfile } = require("../controllers/authController")

const router = express.Router()

// Validation rules
const registerValidation = [
  body("firstName").trim().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
  body("lastName").trim().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("phone").isMobilePhone().withMessage("Please enter a valid phone number"),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
  body("password").exists().withMessage("Password is required"),
]

// Routes
router.post("/register", registerValidation, register)
router.post("/login", loginValidation, login)
router.get("/profile", auth, getProfile)
router.put("/profile", auth, updateProfile)

module.exports = router
