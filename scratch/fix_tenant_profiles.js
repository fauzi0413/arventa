import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function fixTenantProfiles() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Fixing TenantProfile records in DB via pg...");

  await client.query(`
    UPDATE tenant_profiles
    SET full_name = 'Siti Rahmawati', email = 'tenant.siti@gmail.com', phone_number = '081444444444'
    WHERE nik = '3273012345670001';
  `);

  await client.query(`
    UPDATE tenant_profiles
    SET full_name = 'Rizky Pratama', email = 'tenant.rizky@gmail.com', phone_number = '081555555555'
    WHERE nik = '3273012345670002';
  `);

  await client.query(`
    UPDATE tenant_profiles
    SET full_name = 'FAUZI ADITYA PRATAMA', email = 'fauziadityapratama@gmail.com', phone_number = '081908279448'
    WHERE nik = '3216060301040011';
  `);

  await client.query(`
    UPDATE tenant_profiles
    SET full_name = 'santoso', email = 'santoso@gmail.com', phone_number = '08172999210'
    WHERE nik = '3201371788788742';
  `);

  await client.query(`
    UPDATE tenant_profiles
    SET full_name = 'test 4', email = 'test4@gmail.com', phone_number = '081709287022'
    WHERE nik = '3201967416078306';
  `);

  console.log("✅ All TenantProfile records updated in DB via raw SQL!");
  await client.end();
}

fixTenantProfiles().catch(console.error);
