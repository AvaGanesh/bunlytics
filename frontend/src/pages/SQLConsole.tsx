import { useState, useRef, useEffect } from "react";
import { Play, Loader2, Columns2, Rows2, History, Clock } from "lucide-react";
import { runQuery } from "../lib/api";

type QueryHistoryItem = {
  id: string;
  sql: string;
  timestamp: Date;
  executionTime: number;
  rowCount: number;
  success: boolean;
  error?: string;
};

export default function SQLConsole() {
  const [sql, setSql] = useState("SELECT * FROM datasets");
  const [result, setResult] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setExecutionTime(null);
    const startTime = performance.now();
    
    try {
      const data = await runQuery(sql);
      const endTime = performance.now();
      const execTime = endTime - startTime;
      setExecutionTime(execTime);
      
      if (data.error) throw new Error(data.error);
      setResult(data);
      
      // Add to history
      setQueryHistory(prev => [{
        id: crypto.randomUUID(),
        sql: sql.trim(),
        timestamp: new Date(),
        executionTime: execTime,
        rowCount: data.rows.length,
        success: true
      }, ...prev].slice(0, 50)); // Keep last 50 queries
      
    } catch (err: any) {
      setError(err.message);
      
      // Add failed query to history
      setQueryHistory(prev => [{
        id: crypto.randomUUID(),
        sql: sql.trim(),
        timestamp: new Date(),
        executionTime: performance.now() - startTime,
        rowCount: 0,
        success: false,
        error: err.message
      }, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current.getBoundingClientRect();
      let newPosition;
      
      if (layout === "horizontal") {
        newPosition = ((e.clientX - container.left) / container.width) * 100;
      } else {
        newPosition = ((e.clientY - container.top) / container.height) * 100;
      }
      
      setSplitPosition(Math.min(Math.max(newPosition, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, layout]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <h1 className="font-bold text-gray-900">SQL Console</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Query History"
          >
            <History size={18} />
            {queryHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {queryHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setLayout(layout === "horizontal" ? "vertical" : "horizontal")}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={layout === "horizontal" ? "Switch to vertical layout" : "Switch to horizontal layout"}
          >
            {layout === "horizontal" ? <Rows2 size={18} /> : <Columns2 size={18} />}
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Run Query
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="font-semibold text-sm text-gray-700">Query History</h2>
              <p className="text-xs text-gray-500 mt-1">{queryHistory.length} queries</p>
            </div>
            <div className="p-2 space-y-2">
              {queryHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No queries yet
                </div>
              ) : (
                queryHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSql(item.sql)}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      item.success 
                        ? "bg-white border-gray-200 hover:border-blue-300" 
                        : "bg-red-50 border-red-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <code className="text-xs font-mono text-gray-700 line-clamp-2 flex-1">
                        {item.sql}
                      </code>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {item.success ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="font-mono">
                        {item.executionTime < 1000 
                          ? `${item.executionTime.toFixed(0)}ms` 
                          : `${(item.executionTime / 1000).toFixed(2)}s`}
                      </span>
                      {item.success && (
                        <span>{item.rowCount} rows</span>
                      )}
                    </div>
                    {item.error && (
                      <div className="mt-1 text-xs text-red-600 truncate">
                        {item.error}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div 
          ref={containerRef}
          className={`flex-1 flex overflow-hidden ${layout === "horizontal" ? "flex-row" : "flex-col"}`}
        >
        {/* Editor */}
        <div 
          className="bg-gray-50 flex flex-col p-4"
          style={{
            [layout === "horizontal" ? "width" : "height"]: `${splitPosition}%`
          }}
        >
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none"
            placeholder="SELECT * FROM ..."
          />
          <div className="mt-2 text-xs text-gray-500">
            Tip: Use <code className="bg-gray-200 px-1 rounded">Cmd+Enter</code> to run.
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={`bg-gray-300 hover:bg-blue-500 transition-colors flex-shrink-0 ${
            layout === "horizontal" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
          } ${isDragging ? "bg-blue-500" : ""}`}
          onMouseDown={() => setIsDragging(true)}
        />

        {/* Results */}
        <div 
          className="bg-white overflow-auto flex-1"
          style={{
            [layout === "horizontal" ? "width" : "height"]: `${100 - splitPosition}%`
          }}
        >
          {error && (
            <div className="p-4 m-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
              {error}
            </div>
          )}

          {result && (
            <>
              {result.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <p className="text-lg font-medium mb-2">Query executed successfully</p>
                  <p className="text-sm">No rows returned</p>
                  <div className="mt-4 flex gap-4 text-xs">
                    <div className="bg-gray-50 px-4 py-2 rounded border border-gray-200">
                      <span className="font-mono">{result.columns.length} columns</span>
                    </div>
                    {executionTime !== null && (
                      <div className="bg-green-50 px-4 py-2 rounded border border-green-200 text-green-700">
                        <span className="font-mono">
                          {executionTime < 1000 
                            ? `${executionTime.toFixed(2)}ms` 
                            : `${(executionTime / 1000).toFixed(2)}s`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {executionTime !== null && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 flex items-center gap-4">
                      <span>{result.rows.length} rows returned</span>
                      <span className="text-green-600 font-mono">
                        ⚡ {executionTime < 1000 
                          ? `${executionTime.toFixed(2)}ms` 
                          : `${(executionTime / 1000).toFixed(2)}s`}
                      </span>
                    </div>
                  )}
                  <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col} className="px-4 py-3 font-medium text-gray-500 border-b border-gray-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="px-4 py-2 text-gray-700">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </>
              )}
            </>
          )}
          
          {!result && !error && !loading && (
             <div className="flex items-center justify-center h-full text-gray-400">
                 Run a query to see results
             </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
