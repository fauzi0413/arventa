async function checkTenantNames() {
  const res = await fetch("http://localhost:3000/api/tenants?limit=100");
  const json = await res.json();
  console.log("=== TENANT PROFILES DATA ===");
  json.data.forEach((t) => {
    console.log({
      id: t.id,
      profileFullName: t.fullName,
      userFullName: t.user?.fullName,
      email: t.email || t.user?.email,
      phone: t.phoneNumber || t.user?.phoneNumber,
      nik: t.nik
    });
  });
}
checkTenantNames();
