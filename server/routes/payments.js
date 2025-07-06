const express = require("express")
const { body } = require("express-validator")
const { auth } = require("../middleware/auth")
const Payment = require("../models/Payment")

const router = express.Router()

// Get user's payment history
router.get("/", auth, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await Payment.countDocuments({ user: req.user.id })

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get payments error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create new payment
router.post(
  "/",
  [
    auth,
    body("recipient.name").trim().isLength({ min: 2 }).withMessage("Recipient name is required"),
    body("recipient.address").trim().isLength({ min: 5 }).withMessage("Recipient address is required"),
    body("billType")
      .isIn(["electricity", "water", "rent", "internet", "phone", "gas", "other"])
      .withMessage("Invalid bill type"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("paymentMethod").isIn(["card", "bank_transfer", "paypal"]).withMessage("Invalid payment method"),
  ],
  async (req, res) => {
    try {
      const payment = new Payment({
        user: req.user.id,
        ...req.body,
      })

      // Mock payment processing
      payment.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      payment.status = "processing"

      await payment.save()

      // Simulate payment completion after 2 seconds (in real app, this would be handled by webhook)
      setTimeout(async () => {
        try {
          payment.status = "completed"
          payment.completedAt = new Date()
          await payment.save()
        } catch (err) {
          console.error("Payment completion error:", err)
        }
      }, 2000)

      res.status(201).json({
        message: "Payment initiated successfully",
        payment,
      })
    } catch (error) {
      console.error("Create payment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get payment by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id,
    })

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    res.json({ payment })
  } catch (error) {
    console.error("Get payment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
