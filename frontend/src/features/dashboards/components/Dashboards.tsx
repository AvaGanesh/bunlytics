import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Plus } from "lucide-react";
import { dashboardsService } from "../services/dashboardsService";

export default function Dashboards() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  async function loadDashboards() {
    try {
      const data = await dashboardsService.fetchAll();
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate() {
    const name = prompt("Dashboard Name:");
    if (!name) return;
    
    setIsCreating(true);
    try {
        await dashboardsService.create(name);
        await loadDashboards();
    } catch (err) {
        alert("Failed to create dashboard");
    } finally {
        setIsCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-gray-500 mt-1">Visualize your data</p>
        </div>
        
        <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          <span>New Dashboard</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((d) => (
          <Link key={d.id} to={`/dashboards/${d.id}`} className="block group">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-all h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <LayoutDashboard size={24} />
                </div>
              </div>
              
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{d.name}</h3>
              <p className="text-sm text-gray-400">Created {new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
        
         {dashboards.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No dashboards yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
