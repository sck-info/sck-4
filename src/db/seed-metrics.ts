import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding metrics database...");

  try {
    console.log("Seeding default metrics...");
    const existingMetrics = await db.select().from(schema.metrics);
    if (existingMetrics.length === 0) {
      const defaultMetrics = [
        { num: "13+", label: "Years Experience", sortOrder: 10, isActive: true },
        { num: "1.5L+", label: "Lives Touched", sortOrder: 20, isActive: true },
        { num: "5+", label: "Countries Reached", sortOrder: 30, isActive: true },
        { num: "8", label: "States in India", sortOrder: 40, isActive: true },
        { num: "30,000+", label: "Corporate Trained", sortOrder: 50, isActive: true },
        { num: "1000+", label: "Satsangs Done", sortOrder: 60, isActive: true },
        { num: "2000+", label: "CST Sessions", sortOrder: 70, isActive: true },
        { num: "250+", label: "Rakkenho Sessions", sortOrder: 80, isActive: true },
        { num: "300+", label: "Music Therapy Sessions", sortOrder: 90, isActive: true },
        { num: "100+", label: "Music Students", sortOrder: 100, isActive: true },
      ];
      await db.insert(schema.metrics).values(defaultMetrics);
      console.log("Created default metrics records successfully!");
    } else {
      console.log("Metrics already seeded");
    }

    console.log("Metrics seeding completed successfully!");
  } catch (error) {
    console.error("Error during metrics seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
