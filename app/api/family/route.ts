import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const familyMemberData = await request.json()

    // Check if family member is a registered user
    let registeredUser = null
    if (familyMemberData.email) {
      registeredUser = await User.findOne({ email: familyMemberData.email })
    }

    const familyMember = {
      ...familyMemberData,
      isRegistered: !!registeredUser,
      userId: registeredUser?._id,
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $push: { familyMembers: familyMember } },
      { new: true, runValidators: true },
    ).select("-password")

    return NextResponse.json({
      message: "Family member added successfully",
      familyMember: updatedUser.familyMembers[updatedUser.familyMembers.length - 1],
    })
  } catch (error) {
    console.error("Add family member error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { familyMemberId, updates } = await request.json()

    const updatedUser = await User.findOneAndUpdate(
      { _id: user.id, "familyMembers._id": familyMemberId },
      { $set: { "familyMembers.$": { ...updates, _id: familyMemberId } } },
      { new: true, runValidators: true },
    ).select("-password")

    if (!updatedUser) {
      return NextResponse.json({ message: "Family member not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Family member updated successfully",
      familyMembers: updatedUser.familyMembers,
    })
  } catch (error) {
    console.error("Update family member error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const familyMemberId = searchParams.get("id")

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $pull: { familyMembers: { _id: familyMemberId } } },
      { new: true },
    ).select("-password")

    return NextResponse.json({
      message: "Family member removed successfully",
      familyMembers: updatedUser.familyMembers,
    })
  } catch (error) {
    console.error("Remove family member error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
