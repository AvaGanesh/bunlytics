import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Database, Terminal } from "lucide-react";
import Datasets from "./features/datasets/components/Datasets";
import SQLConsole from "./features/sql/components/SQLConsole";
import Dashboards from "./features/dashboards/components/Dashboards";
import DashboardView from "./features/dashboards/components/DashboardView";
import Login from "./features/auth/components/Login";
import Register from "./features/auth/components/Register";

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Bunlytics
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" icon={<Database size={20} />} label="Datasets" />
          <NavLink to="/sql" icon={<Terminal size={20} />} label="SQL Console" />
          <NavLink to="/dashboards" icon={<LayoutDashboard size={20} />} label="Dashboards" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Datasets />} />
          <Route path="/sql" element={<SQLConsole />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/dashboards/:id" element={<DashboardView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default App;
