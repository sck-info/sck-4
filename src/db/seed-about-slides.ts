import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding about slides database...");

  try {
    console.log("Seeding default slideshow slides...");
    const existingSlides = await db.select().from(schema.aboutSlides);
    if (existingSlides.length === 0) {
      const defaultSlides = [
        {
          imageUrl: "/images/sck-lifeskills.jpeg",
          tag: "LIFE SKILLS FACILITATOR",
          alt: "Sharath Chandra Kancherla - CST touch",
          sortOrder: 10,
          isActive: true,
        },
        {
          imageUrl: "/images/sck-music-therapy.jpeg",
          tag: "MUSIC THERAPIST",
          alt: "Sharath Chandra Kancherla - Swara Frequencies",
          sortOrder: 20,
          isActive: true,
        },
        {
          imageUrl: "/images/sck-yoga.jpeg",
          tag: "YOGA & RAKKENHO",
          alt: "Sharath Chandra Kancherla - Sole Pressure",
          sortOrder: 30,
          isActive: true,
        },
        {
          imageUrl: "/images/sck-tutuor.jpeg",
          tag: "VEDIC ASTROLOGER",
          alt: "Sharath Chandra Kancherla - Habit Adjustments",
          sortOrder: 40,
          isActive: true,
        },
        {
          imageUrl: "/images/sck-cool.jpeg",
          tag: "NLP COACH & MENTOR",
          alt: "Sharath Chandra Kancherla - Chart Reading",
          sortOrder: 50,
          isActive: true,
        },
      ];

      await db.insert(schema.aboutSlides).values(defaultSlides);
      console.log("Created default slideshow records successfully!");
    } else {
      console.log("Slides already seeded");
    }

    console.log("Slides seeding completed successfully!");
  } catch (error) {
    console.error("Error during slides seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
