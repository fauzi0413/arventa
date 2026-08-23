async function inspectLeaseLogs() {
  const res = await fetch("http://localhost:3000/api/tenants?limit=100");
  const json = await res.json();
  console.log("=== TENANTS WITH LEASE LOGS ===");
  json.data.forEach((t) => {
    const logs = t.leaseLogs || [];
    const latestLog = logs.length > 0 ? logs[0] : null;
    console.log({
      id: t.id,
      name: t.user?.fullName || t.fullName,
      latestLogToStatus: latestLog?.toStatus,
      latestLogTitle: latestLog?.title,
      logsCount: logs.length
    });
  });
}
inspectLeaseLogs();
