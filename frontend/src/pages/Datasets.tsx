import { useEffect, useState } from "react";
import { Upload, FileText, Database } from "lucide-react";
import { fetchDatasets, uploadDataset } from "../lib/api";

export default function Datasets() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    const data = await fetchDatasets();
    setDatasets(data);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadDataset(file);
      await loadDatasets();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-500 mt-1">Manage your local data files</p>
        </div>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <Upload size={18} />
          <span>{uploading ? "Uploading..." : "Upload CSV"}</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((ds) => (
          <div key={ds.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <FileText size={24} />
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                {ds.source_type}
              </span>
            </div>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{ds.name}</h3>
            <code className="text-xs text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{ds.table_name}</code>
            
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Database size={14} />
                <span>{ds.row_count.toLocaleString()} rows</span>
              </div>
            </div>
          </div>
        ))}
        
        {datasets.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No datasets yet. Upload a CSV to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}
