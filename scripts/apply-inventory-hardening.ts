import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL!;
const pool = new Pool({ connectionString });

async function applyHardening() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database schema hardening for Inventory & Forum...");

    // 1. Create Enum InventoryLocationType if not exists
    console.log("1. Checking Enum InventoryLocationType...");
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryLocationType') THEN
          CREATE TYPE "InventoryLocationType" AS ENUM ('UNIT', 'COMMON_AREA');
        END IF;
      END $$;
    `);

    // 2. Add location_type column to property_inventories
    console.log("2. Adding location_type column to property_inventories...");
    await client.query(`
      ALTER TABLE "property_inventories" 
      ADD COLUMN IF NOT EXISTS "location_type" "InventoryLocationType" DEFAULT 'UNIT' NOT NULL;
    `);

    // 3. Index on property_inventories(property_id)
    console.log("3. Adding index on property_inventories(property_id)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS "property_inventories_property_id_idx" 
      ON "property_inventories"("property_id");
    `);

    // 4. Clean any duplicates in unit_inventories before creating unique constraint
    console.log("4. Cleaning potential duplicates in unit_inventories...");
    await client.query(`
      DELETE FROM "unit_inventories" a
      USING "unit_inventories" b
      WHERE a.id < b.id
        AND a.unit_id = b.unit_id
        AND a.property_inventory_id = b.property_inventory_id
        AND a.property_inventory_id IS NOT NULL;
    `);

    // 5. Unique constraint on unit_inventories(unit_id, property_inventory_id)
    console.log("5. Adding unique constraint on unit_inventories(unit_id, property_inventory_id)...");
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unit_inventories_unit_id_property_inventory_id_key'
        ) THEN
          ALTER TABLE "unit_inventories" 
          ADD CONSTRAINT "unit_inventories_unit_id_property_inventory_id_key" 
          UNIQUE ("unit_id", "property_inventory_id");
        END IF;
      END $$;
    `);

    // 6. Indices on unit_inventories
    console.log("6. Adding indices on unit_inventories(unit_id) and unit_inventories(property_inventory_id)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS "unit_inventories_unit_id_idx" 
      ON "unit_inventories"("unit_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "unit_inventories_property_inventory_id_idx" 
      ON "unit_inventories"("property_inventory_id");
    `);

    // 7. Index on forum_posts(property_id, created_at)
    console.log("7. Adding index on forum_posts(property_id, created_at)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS "forum_posts_property_id_created_at_idx" 
      ON "forum_posts"("property_id", "created_at");
    `);

    console.log("✅ Database schema hardening applied successfully!");
  } catch (err) {
    console.error("❌ Error applying schema hardening:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyHardening();
