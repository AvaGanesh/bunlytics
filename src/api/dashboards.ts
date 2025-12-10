import { db } from "../db";

export async function handleDashboards(req: Request): Promise<Response> {
  const method = req.method;
  
  if (method === "GET") {
    const dashboards = db.query("SELECT * FROM dashboards ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(dashboards), { headers: { "Content-Type": "application/json" } });
  }

  if (method === "POST") {
    const body = await req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.run("INSERT INTO dashboards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)", 
        [id, body.name, now, now]);
    return new Response(JSON.stringify({ id, name: body.name }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export async function handleDashboardPanels(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const dashboardId = url.pathname.split("/")[3];
    const method = req.method;

    if (method === "GET") {
        const panels = db.query("SELECT * FROM panels WHERE dashboard_id = ? ORDER BY sort_order ASC").all(dashboardId);
        return new Response(JSON.stringify(panels), { headers: { "Content-Type": "application/json" } });
    }

    if (method === "POST") {
        const body = await req.json();
        const id = crypto.randomUUID();
        db.run(`
            INSERT INTO panels (id, dashboard_id, title, panel_type, sql, x_field, y_field, options_json, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, dashboardId, body.title, body.panel_type, body.sql, body.x_field, body.y_field, JSON.stringify(body.options), body.sort_order || 0]);
        return new Response(JSON.stringify({ id, ...body }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method Not Allowed", { status: 405 });
}

export async function handleRunDashboard(req: Request) {
    const url = new URL(req.url);
    const dashboardId = url.pathname.split("/")[3];

    const panels = db.query("SELECT * FROM panels WHERE dashboard_id = ?").all(dashboardId) as any[];
    
    const results = panels.map(panel => {
        try {
            const rows = db.query(panel.sql).all();
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
            const data = rows.map(r => Object.values(r));
            return {
                id: panel.id,
                title: panel.title,
                panel_type: panel.panel_type,
                columns,
                rows: data,
                error: null
            };
        } catch (e) {
            return {
                id: panel.id,
                title: panel.title,
                error: String(e)
            };
        }
    });

    return new Response(JSON.stringify({ dashboard_id: dashboardId, panels: results }), {
        headers: { "Content-Type": "application/json" }
    });
}
