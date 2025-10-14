import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@newcondo/auth";

export const metadata: Metadata = {
  title: "Marking Settings | Newcondo Admin",
  description: "Configure property marking service settings",
};

export default async function MarkingSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marking Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure pricing, time slots, and service parameters for property marking
        </p>
      </div>

      <div className="grid gap-6">
        {/* Pricing Configuration */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marking Job Fee (NGN)
                </label>
                <input
                  type="number"
                  defaultValue={20000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="20000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Commission Rate (%)
                </label>
                <input
                  type="number"
                  defaultValue={25}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="25"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Agent receives: ₦5,000 (25%) | Newcondo receives: ₦15,000 (75%)
            </p>
          </div>
        </div>

        {/* Time Slot Configuration */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Time Slot Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Time Slot (Hours)
                </label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Confirmation Deadline (Days)
                </label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compensation Configuration */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Compensation Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Agent Compensation (NGN)
                </label>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Non-Confirmation Compensation (NGN)
                </label>
                <input
                  type="number"
                  defaultValue={3000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="3000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service Area Configuration */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Service Area Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Service Radius (km)
              </label>
              <input
                type="number"
                defaultValue={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                placeholder="15"
              />
            </div>
            <p className="text-sm text-gray-500">
              Agents within this radius will receive marking job notifications
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
            Save Settings
          </button>
          <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}