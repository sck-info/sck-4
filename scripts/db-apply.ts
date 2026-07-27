import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide a SQL file path as an argument.");
  process.exit(1);
}

const absolutePath = path.resolve(filePath);
if (!fs.existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

const sql = fs.readFileSync(absolutePath, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  console.log(`Applying SQL script: ${filePath}...`);
  try {
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`Successfully applied: ${filePath}`);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error(`Error applying SQL script: ${filePath}`);
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
