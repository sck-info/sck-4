import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding offering categories & sub-categories...");

  try {
    // Clean old data to allow clean re-runs
    console.log("Clearing existing offering categories & sub-categories...");
    await db.delete(schema.offeringSubCategories);
    await db.delete(schema.offeringCategories);

    // 1. Alternative Therapies
    const [therapyCat] = await db
      .insert(schema.offeringCategories)
      .values({
        name: "Alternative Therapies",
        description: "Gentle, evidence-informed body-based therapies that work on the nervous system, energy field, and emotional body to restore natural flow and deep healing.",
        sanskritText: "शरीरमाद्यं खलु धर्मसाधनम् • आरोग्यं परमं भाग्यं स्वास्थ्यं सर्वार्थसाधनम्",
        sanskritMeaning: "The body is the primary vehicle for life's purpose. Complete physical and emotional restoration is the ultimate fortune, and therapies are key to absolute wellness.",
        sortOrder: 10,
        isActive: true,
      })
      .returning();

    console.log("Created Category: Alternative Therapies");

    await db.insert(schema.offeringSubCategories).values([
      {
        categoryId: therapyCat.id,
        name: "CranioSacral Therapy (CST)",
        description: "Gentle touch that supports nervous system regulation, deep relaxation, and the body's natural healing process. Over 2,000 sessions conducted.",
        topTags: ["Popular"],
        tags: ["Nervous system regulation", "Deep relaxation", "Natural healing", "Stress relief"],
        requiresBooking: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        categoryId: therapyCat.id,
        name: "Rakkenho Therapy",
        description: "A Japanese holistic healing technique that uses gentle foot pressure and rhythmic bodywork to relieve stress, improve posture and circulation, ease muscular tension, and support overall well-being.",
        topTags: [],
        tags: ["Stress relief", "Better posture", "Circulation boost", "Emotional balance"],
        requiresBooking: true,
        sortOrder: 20,
        isActive: true,
      },
      {
        categoryId: therapyCat.id,
        name: "Music Therapy",
        description: "The therapeutic use of music and sound to reduce stress, uplift the mind, and support emotional and physical wellness.",
        topTags: [],
        tags: ["Stress reduction", "Emotional uplift", "Mental clarity", "Physical wellness"],
        requiresBooking: true,
        sortOrder: 30,
        isActive: true,
      },
    ]);
    console.log("Seeded sub-categories for Alternative Therapies");

    // 2. Jyothishya Consultations
    const [consultationCat] = await db
      .insert(schema.offeringCategories)
      .values({
        name: "Jyothishya Consultations",
        description: "Timeless Vedic guidance to bring clarity, direction, and deeper understanding of your life's journey.",
        sanskritText: "ज्योतिषं ज्ञानचक्षुषां मार्गदर्शकम् • तमसो मा ज्योतिर्गमय",
        sanskritMeaning: "Astrology is the guiding vision of knowledge, inspiring us to move beyond confusion and toward truth, clarity, and light.",
        sortOrder: 20,
        isActive: true,
      })
      .returning();

    console.log("Created Category: Jyothishya Consultations");

    await db.insert(schema.offeringSubCategories).values([
      {
        categoryId: consultationCat.id,
        name: "Vedic Astrology",
        description: "Ancient wisdom that offers guidance on life, relationships, career, and personal growth through planetary analysis of your birth chart.",
        topTags: ["Hot"],
        tags: ["Life path clarity", "Relationship insights", "Career guidance", "Planetary analysis"],
        requiresBooking: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        categoryId: consultationCat.id,
        name: "Palmistry",
        description: "The study of the hand to understand personality traits, innate potential, and life patterns. A living map of your strengths and destiny.",
        topTags: [],
        tags: ["Personality insights", "Innate potential", "Life patterns", "Strengths discovery"],
        requiresBooking: true,
        sortOrder: 20,
        isActive: true,
      },
      {
        categoryId: consultationCat.id,
        name: "Medical Astrology",
        description: "Vedic analysis focusing on bodily patterns, vitality, and planetary indications relating to health.",
        topTags: [],
        tags: ["Bodily patterns", "Vitality", "Health indications"],
        requiresBooking: true,
        sortOrder: 30,
        isActive: true,
      },
      {
        categoryId: consultationCat.id,
        name: "Prasna Hora",
        description: "A question-based astrological method that provides timely guidance by examining the moment a query is raised. Precise answers for specific life decisions.",
        topTags: [],
        tags: ["Specific answers", "Decision clarity", "Timely guidance", "Question astrology"],
        requiresBooking: true,
        sortOrder: 40,
        isActive: true,
      },
    ]);
    console.log("Seeded sub-categories for Jyothishya Consultations");

    // 3. Music Classes
    const [musicClassesCat] = await db
      .insert(schema.offeringCategories)
      .values({
        name: "Music Classes",
        description: "Structured music education in Carnatic and light music traditions — offered as intimate 1-on-1 sessions or community group classes.",
        sanskritText: "नादब्रह्म परानन्दः • संगीतं मुक्तिदायकम्",
        sanskritMeaning: "Sound resonance is the supreme bliss. Dedicated musical practice purifies the soul and unlocks emotional harmony and vocal mastery.",
        sortOrder: 30,
        isActive: true,
      })
      .returning();

    console.log("Created Category: Music Classes");

    await db.insert(schema.offeringSubCategories).values([
      {
        categoryId: musicClassesCat.id,
        name: "Music Classes — 1-on-1",
        description: "Personalised one-on-one music lessons in Carnatic and light music. Tailored to your pace, level, and musical goals.",
        topTags: [],
        tags: ["Personalised pace", "Carnatic & light music", "Voice & technique", "Dedicated attention"],
        requiresBooking: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        categoryId: musicClassesCat.id,
        name: "Music Classes — Group",
        description: "Learn in a vibrant group setting. Build musical foundations, share the joy of music with fellow learners.",
        topTags: [],
        tags: ["Community learning", "Affordable access", "Shared motivation", "Carnatic & light music"],
        requiresBooking: true,
        sortOrder: 20,
        isActive: true,
      },
    ]);
    console.log("Seeded sub-categories for Music Classes");

    // 4. Mind & Body Workshops
    const [workshopsCat] = await db
      .insert(schema.offeringCategories)
      .values({
        name: "Mind & Body Workshops",
        description: "Deep-dive transformative programmes combining theory, experiential practice, and personal coaching — available online and in-person.",
        sanskritText: "ज्ञानेन हि सदृशं पवित्रमिह न विद्यते",
        sanskritMeaning: "There is no purifier in this world like mindful learning. We adjust subconscious habits, cognitive focus, and nutrition to cultivate balanced life energy.",
        sortOrder: 40,
        isActive: true,
      })
      .returning();

    console.log("Created Category: Mind & Body Workshops");

    await db.insert(schema.offeringSubCategories).values([
      {
        categoryId: workshopsCat.id,
        name: "Neuro Linguistic Programme (NLP)",
        description: "A practical approach to understanding how thoughts, language, and behavior influence personal and professional success.",
        topTags: [],
        tags: ["Mindset reprogramming", "Communication mastery", "Personal growth", "Behavioural change"],
        requiresBooking: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        categoryId: workshopsCat.id,
        name: "Holistic Lifestyle & Nutrition Workshop",
        description: "A transformative wellness programme that combines nutrition, conscious living, and lifestyle practices to help participants cultivate lasting health.",
        topTags: [],
        tags: ["Nutrition science", "Conscious living", "Lifestyle design", "Inner harmony"],
        requiresBooking: true,
        sortOrder: 20,
        isActive: true,
      },
    ]);
    console.log("Seeded sub-categories for Mind & Body Workshops");

    // 5. Satsangs
    const [satsangsCat] = await db
      .insert(schema.offeringCategories)
      .values({
        name: "Satsangs",
        description: "Satsang is a spiritual gathering dedicated to truth, wisdom, and inner growth through devotional singing, inspiring discourses, meditation, and meaningful discussions.",
        sanskritText: "सत्सङ्गत्वे निस्सङ्गत्वम्",
        sanskritMeaning: "In the company of truth, the mind becomes free. Through music, meditation, and wisdom, satsang nurtures joy, inner peace, and connection.",
        sortOrder: 50,
        isActive: true,
      })
      .returning();

    console.log("Created Category: Satsangs");

    await db.insert(schema.offeringSubCategories).values([
      {
        categoryId: satsangsCat.id,
        name: "Bhajan Jamming",
        description: "A youth-centric devotional music experience where high-energy bhajans, live instruments, and interactive participation create an uplifting atmosphere.",
        topTags: [],
        tags: ["High-energy live music", "Youth engagement", "Collective joy & connection", "Meditative yet vibrant"],
        requiresBooking: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        categoryId: satsangsCat.id,
        name: "Private Satsang",
        description: "A personalised satsang organised for homes, organisations, celebrations, or special occasions.",
        topTags: [],
        tags: ["Personalised experience", "Spiritual upliftment", "Team & family bonding", "Customised programme"],
        requiresBooking: true,
        sortOrder: 20,
        isActive: true,
      },
      {
        categoryId: satsangsCat.id,
        name: "Open Satsang",
        description: "A community gathering featuring devotional music, guided meditation, wisdom talks, and joyful celebration.",
        topTags: [],
        tags: ["Inner peace", "Collective meditation", "Devotional music", "Community connection"],
        requiresBooking: true,
        sortOrder: 30,
        isActive: true,
      },
    ]);
    console.log("Seeded sub-categories for Satsangs");

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
