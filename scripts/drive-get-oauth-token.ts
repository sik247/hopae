/**
 * One-time script to get a Google OAuth2 refresh token for Drive file uploads.
 * Uses OOB (copy-paste) flow — works with Desktop app OAuth clients.
 *
 * Run: npm run drive-get-oauth-token
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { google } from "googleapis"
import * as readline from "readline"
import * as fs from "fs"

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local first.")
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob")

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
  prompt: "consent",
})

// Open browser automatically on macOS
import { execSync } from "child_process"
try {
  execSync(`open "${authUrl}"`)
  console.log("Browser opened. Authorize access in the browser window.\n")
} catch {
  console.log("Open this URL in your browser:\n")
  console.log(authUrl)
  console.log()
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question("Paste the authorization code from the browser: ", async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    const refreshToken = tokens.refresh_token
    if (!refreshToken) {
      console.error("\nNo refresh token returned. Try revoking app access at https://myaccount.google.com/permissions and re-running.")
      process.exit(1)
    }

    // Write directly into .env.local
    const envPath = ".env.local"
    let envContent = fs.readFileSync(envPath, "utf8")
    if (envContent.includes("GOOGLE_OAUTH_REFRESH_TOKEN=")) {
      envContent = envContent.replace(/GOOGLE_OAUTH_REFRESH_TOKEN=.*/,  `GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}`)
    } else {
      envContent += `\nGOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}\n`
    }
    fs.writeFileSync(envPath, envContent)

    console.log("\n✅ Refresh token saved to .env.local automatically.")
    console.log("Run: npm run sync-integrations\n")
  } catch (err) {
    console.error("Failed to exchange code:", err)
    process.exit(1)
  }
})
