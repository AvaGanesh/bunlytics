import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Play, Save, RefreshCw, BarChart3, Table as TableIcon, Hash } from "lucide-react";
import { dashboardsService } from "../services/dashboardsService";

export default function DashboardView() {
  const { id } = useParams();
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadPanels();
    }
  }, [id]);

  async function loadPanels() {
    try {
      const data = await dashboardsService.fetchPanels(id!);
      setPanels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunDashboard() {
    try {
      const data = await dashboardsService.run(id!);
      if (data.panels) {
        const resultsMap: Record<string, any> = {};
        data.panels.forEach((p: any) => {
           resultsMap[p.id] = p;
        });
        setResults(resultsMap);
      }
    } catch (e) {
      alert("Failed to run dashboard");
    }
  }

  async function handleAddPanel() {
    const title = prompt("Panel Title");
    if (!title) return;
    
    const sql = prompt("SQL Query", "SELECT * FROM queries LIMIT 5");
    if (!sql) return;

    try {
      await dashboardsService.addPanel(id!, {
         title,
         panel_type: "table",
         sql,
         options: {}
      });
      await loadPanels();
    } catch (e) {
      alert("Failed to add panel");
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
       <header className="flex justify-between items-center mb-8">
        <div>
           {/* We don't have dashboard name in runDashboard response yet, but that's fine for MVP */}
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1> 
          <p className="text-gray-500 mt-1 text-xs">{id}</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleRunDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Play size={18} />
                <span>Run Dashboard</span>
            </button>
            <button 
                onClick={handleAddPanel}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
                <Plus size={18} />
                <span>Add Panel</span>
            </button>
        </div>
      </header>

      {loading && <div className="text-center py-12">Loading...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboard?.panels?.map((panel: any) => (
            <PanelCard key={panel.id} panel={panel} />
        ))}
      </div>

      {showAddPanel && (
          <AddPanelModal 
            dashboardId={id!} 
            onClose={() => setShowAddPanel(false)} 
            onAdded={() => { setShowAddPanel(false); loadDashboard(); }} 
          />
      )}
    </div>
  );
}

function PanelCard({ panel }: { panel: any }) {
    if (panel.error) {
        return (
            <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                <h3 className="font-semibold text-red-600 mb-2">{panel.title}</h3>
                <p className="text-sm text-red-500">{panel.error}</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {panel.panel_type === 'table' && <TableIcon size={16} className="text-gray-400" />}
                {panel.panel_type === 'metric' && <Hash size={16} className="text-gray-400" />}
                {panel.panel_type === 'line' && <BarChart3 size={16} className="text-gray-400" />}
                {panel.title}
            </h3>
            
            <div className="flex-1 overflow-auto">
                {panel.panel_type === 'metric' ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-5xl font-bold text-blue-600">
                            {panel.rows?.[0]?.[0] ?? '-'}
                        </span>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {panel.columns.map((col: string) => (
                                    <th key={col} className="px-4 py-2 font-medium text-gray-500 border-b border-gray-100">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                             {panel.rows.map((row: any[], i: number) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-2 text-gray-700">{String(cell)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

function AddPanelModal({ dashboardId, onClose, onAdded }: { dashboardId: string, onClose: () => void, onAdded: () => void }) {
    const [title, setTitle] = useState("");
    const [sql, setSql] = useState("SELECT * FROM datasets LIMIT 5");
    const [type, setType] = useState("table");

    async function handleSave() {
        await addDashboardPanel(dashboardId, {
            title,
            sql,
            panel_type: type,
            options: {}
        });
        onAdded();
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Add Panel</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input className="w-full border rounded-lg p-2" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select className="w-full border rounded-lg p-2" value={type} onChange={e => setType(e.target.value)}>
                            <option value="table">Table</option>
                            <option value="metric">Metric (Single Value)</option>
                            {/* Line/Bar charts require more config (x/y fields), skipping for simple MVP */}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
                        <textarea className="w-full border rounded-lg p-2 font-mono text-sm h-32" value={sql} onChange={e => setSql(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Panel</button>
                </div>
            </div>
        </div>
    )
}
