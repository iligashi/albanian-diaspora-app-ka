import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Feature from "@/models/Feature"
import AdminLog from "@/models/AdminLog"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const features = await Feature.find().sort({ createdAt: -1 }).populate("createdBy", "firstName lastName")

    return NextResponse.json({ features })
  } catch (error) {
    console.error("Get features error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyToken(request)
    if (!admin || admin.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const featureData = await request.json()

    const feature = new Feature({
      ...featureData,
      createdBy: admin.id,
    })

    await feature.save()
    await feature.populate("createdBy", "firstName lastName")

    // Log admin action
    await new AdminLog({
      adminId: admin.id,
      action: "CREATE_FEATURE",
      targetType: "feature",
      targetId: feature._id,
      details: { featureName: feature.name },
    }).save()

    return NextResponse.json({ feature }, { status: 201 })
  } catch (error) {
    console.error("Create feature error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyToken(request)
    if (!admin || admin.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { featureId, updates } = await request.json()

    const feature = await Feature.findByIdAndUpdate(
      featureId,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName")

    if (!feature) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 })
    }

    // Log admin action
    await new AdminLog({
      adminId: admin.id,
      action: "UPDATE_FEATURE",
      targetType: "feature",
      targetId: featureId,
      details: { updates },
    }).save()

    return NextResponse.json({ feature })
  } catch (error) {
    console.error("Update feature error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
