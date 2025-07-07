// ✅ FULL API ENDPOINT: /pages/api/super-admin/dashboard.ts
// Uses: Next.js API Routes + MongoDB + JWT

import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI as string
const JWT_SECRET = process.env.JWT_SECRET as string

if (!MONGODB_URI || !JWT_SECRET) {
  throw new Error('Missing MONGODB_URI or JWT_SECRET in .env.local')
}

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient) return cachedClient
  cachedClient = new MongoClient(MONGODB_URI)
  await cachedClient.connect()
  return cachedClient
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.replace('Bearer ', '')

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' })

    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded) return res.status(403).json({ error: 'Forbidden: Invalid token' })

    const client = await connectToDatabase()
    const db = client.db()

    const usersCol = db.collection('users')
    const paymentsCol = db.collection('payments')
    const giftsCol = db.collection('gifts')
    const servicesCol = db.collection('services')
    const activitiesCol = db.collection('activities')

    // User stats
    const [totalUsers, activeUsers, premiumUsers, newUsers] = await Promise.all([
      usersCol.countDocuments(),
      usersCol.countDocuments({ isActive: true }),
      usersCol.countDocuments({ isPremium: true }),
      usersCol.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      })
    ])

    // Payments
    const payments = await paymentsCol.find().sort({ createdAt: -1 }).limit(10).toArray()
    const totalRevenue = await paymentsCol.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray()
    const monthlyRevenue = await paymentsCol.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray()

    // Gifts
    const giftsAgg = await giftsCol.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray()

    // Services
    const servicesAgg = await servicesCol.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray()

    // Recent users and activities
    const recentUsers = await usersCol.find().sort({ createdAt: -1 }).limit(5).toArray()
    const recentActivities = await activitiesCol.find().sort({ timestamp: -1 }).limit(10).toArray()

    const getCount = (arr: any[], status: string) => arr.find(x => x._id === status)?.count || 0

    return res.status(200).json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          newThisMonth: newUsers,
          growth: 0 // Placeholder or implement real logic
        },
        payments: {
          total: payments.length,
          completed: payments.filter(p => p.status === 'completed').length,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0
        },
        gifts: {
          total: giftsAgg.reduce((a, b) => a + b.count, 0),
          claimed: getCount(giftsAgg, 'claimed'),
          pending: getCount(giftsAgg, 'pending')
        },
        services: {
          total: servicesAgg.reduce((a, b) => a + b.count, 0),
          active: getCount(servicesAgg, 'active'),
          pending: getCount(servicesAgg, 'pending')
        }
      },
      recentUsers,
      payments,
      recentActivities
    })
  } catch (err) {
    console.error('[DASHBOARD_API_ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
