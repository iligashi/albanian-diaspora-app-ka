import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/models/Payment"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { paymentMethod } = await request.json()
    const paymentId = params.id

    const payment = await Payment.findOne({ _id: paymentId, user: user.id })
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    if (payment.status !== "pending") {
      return NextResponse.json({ message: "Payment already processed" }, { status: 400 })
    }

    let paymentResult

    switch (paymentMethod) {
      case "stripe":
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payment.amount * 100), // Convert to cents
          currency: payment.currency.toLowerCase(),
          metadata: {
            paymentId: payment._id.toString(),
            userId: user.id,
            type: "bill_payment",
          },
        })

        payment.stripePaymentIntentId = paymentIntent.id
        payment.status = "processing"
        await payment.save()

        paymentResult = {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }
        break

      case "bank_transfer":
        // Simulate bank transfer processing
        payment.status = "processing"
        await payment.save()

        // Simulate async processing
        setTimeout(async () => {
          try {
            payment.status = "completed"
            payment.completedAt = new Date()
            payment.paymentDate = new Date()
            await payment.save()

            // Update user total spent
            await User.findByIdAndUpdate(user.id, {
              $inc: { totalSpent: payment.amount },
            })
          } catch (err) {
            console.error("Bank transfer completion error:", err)
          }
        }, 5000)

        paymentResult = {
          message: "Bank transfer initiated. Processing may take 1-3 business days.",
        }
        break

      case "paypal":
        // Simulate PayPal processing
        payment.status = "processing"
        await payment.save()

        setTimeout(async () => {
          try {
            payment.status = "completed"
            payment.completedAt = new Date()
            payment.paymentDate = new Date()
            await payment.save()

            await User.findByIdAndUpdate(user.id, {
              $inc: { totalSpent: payment.amount },
            })
          } catch (err) {
            console.error("PayPal completion error:", err)
          }
        }, 2000)

        paymentResult = {
          message: "PayPal payment processing...",
        }
        break

      default:
        return NextResponse.json({ message: "Invalid payment method" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Payment initiated successfully",
      payment,
      ...paymentResult,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 })
  }
}
