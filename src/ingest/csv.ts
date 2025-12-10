import { db } from "../db";

export async function ingestCSV(filePath: string, datasetId: string, tableName: string) {
  const file = Bun.file(filePath);
  const text = await file.text();
  const lines = text.split("\n").filter(l => l.trim().length > 0);

  if (lines.length === 0) throw new Error("Empty CSV file");

  // Infer columns from header
  const header = lines[0];
  const columns = header.split(",").map(c => c.trim().replace(/"/g, ""));
  
  // Simple schema inference could go here, for now assume TEXT for everything to be safe, 
  // or try to detect numbers. Let's stick to TEXT for v1 simplicity or try basic inference.
  // Actually, SQLite is flexible with types. Let's try to be slightly smart.
  
  // Create table
  const columnDefs = columns.map(c => `"${c}" TEXT`).join(", ");
  db.run(`CREATE TABLE "${tableName}" (${columnDefs})`);

  // Prepare insert statement
  const placeholders = columns.map(() => "?").join(", ");
  const insert = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);

  const runTransaction = db.transaction((rows) => {
    for (const row of rows) {
      // Simple CSV parsing (doesn't handle quoted commas well, but good for MVP)
      // For robust parsing we might want a library, but let's try a simple regex or split for now.
      // A simple split is dangerous for real CSVs.
      // Let's use a slightly better regex for splitting CSV lines.
      
      // This regex matches quoted strings or non-comma sequences.
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      // Cleanup quotes
      const cleanedValues = values.map((v: string) => v.replace(/^"|"$/g, "").trim());
      
      // Pad if missing columns
      while (cleanedValues.length < columns.length) cleanedValues.push(null);
      
      insert.run(...cleanedValues);
    }
  });

  // Insert data (skip header)
  runTransaction(lines.slice(1));

  return lines.length - 1; // row count
}
