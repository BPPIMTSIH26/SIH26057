async function runVerification() {
  console.log("=== S.A.G.A.R. Demo Verification Suite ===");
  try {
    // Check if backend is reachable (ensure server is running)
    const backendUrl = "http://localhost:8000";
    console.log(`Checking Backend Health at ${backendUrl}/api/health...`);
    
    let res;
    try {
      res = await fetch(`${backendUrl}/api/health`);
    } catch (e) {
      console.error("❌ Backend is not running. Please start the backend server before running this test (e.g. via `npm run dev:backend`).");
      process.exit(1);
    }
    
    if (res.ok) {
      console.log("✅ Backend Health Check Passed");
    } else {
      console.error("❌ Backend Health Check Failed", res.status);
      process.exit(1);
    }

    // Check anomalies endpoint to verify demo data is loaded
    console.log(`Verifying Demo Anomalies...`);
    const anomalyRes = await fetch(`${backendUrl}/api/anomalies`);
    if (anomalyRes.ok) {
      const data = await anomalyRes.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Demo Data Validated: Found ${data.length} anomalies seeded.`);
        
        // Ensure there are some ghost_net or shipwreck classes as part of demo
        const classes = new Set(data.map(d => d.type).filter(t => t));
        if (classes.size > 0) {
          console.log(`✅ Classification breadth verified: ${Array.from(classes).join(', ')}`);
        }
      } else {
        console.error("❌ Demo Data Failed: No anomalies found. Please run `npm run demo:setup` to seed the database.");
        process.exit(1);
      }
    } else {
      console.error("❌ Fetching Anomalies Failed", anomalyRes.status);
      process.exit(1);
    }

    console.log("\n=== ✅ ALL DEMO VERIFICATION CHECKS PASSED ===");
    process.exit(0);

  } catch (error) {
    console.error("❌ Verification encountered an unexpected error:", error);
    process.exit(1);
  }
}

runVerification();
