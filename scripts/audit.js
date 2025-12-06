import { exec } from 'child_process';

console.log("🛡️  Railnology Security Audit Starting...");
console.log("-----------------------------------------");

// 1. Check for Vulnerabilities
console.log("Running npm audit...");
exec('npm audit --json', (error, stdout, stderr) => {
    const audit = JSON.parse(stdout);
    const vulns = audit.metadata.vulnerabilities;
    
    console.log(`📊 Summary:`);
    console.log(`   Low: ${vulns.low}`);
    console.log(`   Moderate: ${vulns.moderate}`);
    console.log(`   High: ${vulns.high}`);
    console.log(`   Critical: ${vulns.critical}`);

    if (vulns.critical > 0 || vulns.high > 0) {
        console.error("\n❌ CRITICAL/HIGH Vulnerabilities found! Run 'npm audit fix' immediately.");
    } else {
        console.log("\n✅ No critical vulnerabilities found.");
    }
});

// 2. Verify Stack Architecture
console.log("\n🔍 Verifying Architecture...");
import fs from 'fs';
if (fs.existsSync('vite.config.js')) {
    console.log("✅ Vite detected (Client-Side Architecture confirmed).");
} else if (fs.existsSync('next.config.js')) {
    console.warn("⚠️  Next.js detected - Please verify CVE-2025-55182 status.");
} else {
    console.log("ℹ️  Custom architecture detected.");
}