import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding database...");

  try {
    // 1. Seed Roles
    console.log("Seeding roles...");
    const existingRoles = await db.select().from(schema.roles);
    let adminRole = existingRoles.find((r) => r.roleName === "ADMIN");
    let userRole = existingRoles.find((r) => r.roleName === "USER");

    if (!adminRole) {
      const inserted = await db
        .insert(schema.roles)
        .values({ roleName: "ADMIN" })
        .returning();
      adminRole = inserted[0];
      console.log("Created role: ADMIN");
    }

    if (!userRole) {
      const inserted = await db
        .insert(schema.roles)
        .values({ roleName: "USER" })
        .returning();
      userRole = inserted[0];
      console.log("Created role: USER");
    }

    // 2. Seed Admin User
    console.log("Seeding admin user...");
    const adminEmail = "admin@sck.com";
    const existingAdmin = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("SckJGD@123", 10);
      await db.insert(schema.users).values({
        name: "Sharath Chandra Kancherla",
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        sessionVersion: 1,
      });
      console.log("Created admin user: admin@sck.com");
    } else {
      console.log("Admin user already exists");
    }

    // 3. Seed Default Contact Details if empty
    console.log("Seeding default contact details...");
    const existingContacts = await db.select().from(schema.contacts);
    if (existingContacts.length === 0) {
      await db.insert(schema.contacts).values({
        email: "sharathchandra.kancherla@gmail.com",
        phone: "+91 8374896261",
        location: "Hyderabad, Telangana",
        instagramLink: "https://www.instagram.com/sharathkancherla?igsh=MWtvZXI1a3czbzdlYg==",
        linkedinLink: "https://www.linkedin.com/in/sharath-chandra-kancherla-b38422108?utm_source=share_via&utm_content=profile&utm_medium=member_android",
        youtubeLink: "https://youtube.com/@sharathkancherla?si=d8kXq71Z1eJ0e18K",
        isActive: true,
      });
      console.log("Created default contact details record");
    } else {
      console.log("Contact details already seeded");
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
