import AnalyticsChart from "./AnalyticsChart"

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <a
            href="/analytics"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View Analytics
          </a>
          <a
            href="/notifications"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            All Notifications
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-md p-4">
          <h2 className="text-lg font-medium">Total Users</h2>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="bg-white shadow rounded-md p-4">
          <h2 className="text-lg font-medium">New Signups</h2>
          <p className="text-3xl font-bold">45</p>
        </div>
        <div className="bg-white shadow rounded-md p-4">
          <h2 className="text-lg font-medium">Active Users</h2>
          <p className="text-3xl font-bold">890</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-8">
        <AnalyticsChart />
      </div>
    </div>
  )
}
