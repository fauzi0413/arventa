async function inspectRawTenants() {
  const res = await fetch("http://localhost:3000/api/tenants?limit=100");
  const json = await res.json();
  console.log("=== RAW API TENANTS ===");
  json.data.forEach((t) => {
    console.log({
      id: t.id,
      fullName: t.fullName,
      userFullName: t.user?.fullName,
      statusField: t.status,
      userIsActive: t.user?.isActive,
      userRole: t.user?.role,
      leasesCount: t.leases?.length,
      nik: t.nik
    });
  });
}
inspectRawTenants();
