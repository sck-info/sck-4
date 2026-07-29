import { pgTable, uuid } from "drizzle-orm/pg-core";
import { offeringSlots } from "./offering_slots";
import { sessionLocations } from "./session_locations";

export const slotLocationsMap = pgTable("slot_locations_map", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => offeringSlots.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => sessionLocations.id, { onDelete: "cascade" }),
});
