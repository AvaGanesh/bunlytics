export const API_BASE = "/api";

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  return res.json();
}

export async function uploadDataset(file: File, name?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  
  const res = await fetch(`${API_BASE}/datasets`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function runQuery(sql: string) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  return res.json();
}

export async function fetchDashboards() {
  const res = await fetch(`${API_BASE}/dashboards`);
  return res.json();
}

export async function createDashboard(name: string) {
  const res = await fetch(`${API_BASE}/dashboards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function fetchDashboardPanels(id: string) {
  const res = await fetch(`${API_BASE}/dashboards/${id}/panels`);
  return res.json();
}

export async function addDashboardPanel(dashboardId: string, panel: any) {
  const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/panels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(panel),
  });
  return res.json();
}

export async function runDashboard(id: string) {
    const res = await fetch(`${API_BASE}/dashboards/${id}/run`);
    return res.json();
}
