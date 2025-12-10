import { db } from "../db";
import { requireAuth } from "../middleware";

export async function handleQuery(req: Request) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { sql, datasetId } = body;

    if (!sql || !sql.trim().toLowerCase().startsWith("select")) {
      return new Response("Invalid query. Only SELECT allowed.", { status: 400 });
    }

    const startTime = performance.now();
    const queryId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      const rows = db.query(sql).all();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Extract columns from the first row if exists, or empty
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      
      // Format as array of arrays
      const formattedRows = rows.map(row => Object.values(row));

      // Persist query to history
      db.run(
        "INSERT INTO queries (id, user_id, dataset_id, sql, status, duration_ms, row_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [queryId, user.userId, datasetId || null, sql.trim(), "success", duration, rows.length, now]
      );

      return new Response(JSON.stringify({ columns, rows: formattedRows }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Persist failed query
      db.run(
        "INSERT INTO queries (id, user_id, dataset_id, sql, status, error_message, duration_ms, row_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [queryId, user.userId, datasetId || null, sql.trim(), "error", String(e), duration, 0, now]
      );
      
      return new Response(JSON.stringify({ error: String(e) }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
