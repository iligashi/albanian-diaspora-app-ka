import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/models/Payment"
import Gift from "@/models/Gift"
import Service from "@/models/Service"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const format = searchParams.get("format") || "json"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const dateFilter: any = { user: user.id }
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const data: any = {}

    if (type === "all" || type === "payments") {
      data.payments = await Payment.find(dateFilter).sort({ createdAt: -1 })
    }

    if (type === "all" || type === "gifts") {
      data.gifts = await Gift.find(dateFilter).sort({ createdAt: -1 })
    }

    if (type === "all" || type === "services") {
      data.services = await Service.find(dateFilter).sort({ createdAt: -1 })
    }

    if (format === "csv") {
      // Convert to CSV format
      let csv = ""

      if (data.payments) {
        csv += "PAYMENTS\n"
        csv += "Date,Recipient,Bill Type,Amount,Status\n"
        data.payments.forEach((payment: any) => {
          csv += `${payment.createdAt.toISOString()},${payment.recipient.name},${payment.billType},${payment.amount},${payment.status}\n`
        })
        csv += "\n"
      }

      if (data.gifts) {
        csv += "GIFTS\n"
        csv += "Date,Recipient,Item,Category,Amount,Status\n"
        data.gifts.forEach((gift: any) => {
          csv += `${gift.createdAt.toISOString()},${gift.recipient.name},${gift.item.name},${gift.category},${gift.totalAmount},${gift.status}\n`
        })
        csv += "\n"
      }

      if (data.services) {
        csv += "SERVICES\n"
        csv += "Date,Title,Category,Price,Status\n"
        data.services.forEach((service: any) => {
          csv += `${service.createdAt.toISOString()},${service.title},${service.category},${service.price},${service.status}\n`
        })
      }

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="diaspora-data-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      data,
      exportedAt: new Date().toISOString(),
      type,
      format,
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
