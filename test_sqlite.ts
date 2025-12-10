import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run("CREATE TABLE foo (id INTEGER, name TEXT)");
db.run("INSERT INTO foo VALUES (1, 'bar')");
db.run("INSERT INTO foo VALUES (2, 'baz')");

const rows = db.query("SELECT * FROM foo").all();
console.log("Rows:", rows);
console.log("Keys:", Object.keys(rows[0]));
console.log("Values:", Object.values(rows[0]));
