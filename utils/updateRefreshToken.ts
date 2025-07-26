import { BrowserContext, chromium, Page, request } from "@playwright/test";
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Resolve the path to the .env file (used later for updating the refresh token)
const envPath = path.resolve(__dirname, '../.env');

// This function automates the OAuth login flow and fetches the authorization code
async function getAuthCode(page: Page) {
  // Construct the authorization URL with required query parameters
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SFDC_CLIENT_ID!,
    redirect_uri: process.env.SFDC_REDIRECT_URI!,
    scope: 'web refresh_token api', // specify required scopes
  });
  const authUrl = `${process.env.SFDC_BASE_URL}/services/oauth2/authorize?${params.toString()}`;

  console.log(`Navigating to: ${authUrl}`);
  await page.goto(authUrl);

  // Fill in the login form with username and password
  console.log(`Filling in username and password`);
  await page.fill('input#username', process.env.SFDC_USERNAME!);
  await page.fill('input#password', process.env.SFDC_PASSWORD!);

  // Click the Login button and wait for navigation to complete
  console.log(`Clicking login button`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('input#Login'),
  ]);

  // Check if the authorization page appears and click "Allow"
  const allowButton = page.getByRole('button', { name: 'Allow', exact: true });
  if (await allowButton.isVisible()) {
    console.log(`Authorization required. Clicking Allow button`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      allowButton.click(),
    ]);
  } else {
    console.log(`Allow button not visible. Skipping authorization step`);
  }

  // Get the current URL after redirection and extract the authorization code
  const redirectedUrl = page.url();
  console.log(`Redirected to URL: ${redirectedUrl}`);
  const urlObj = new URL(redirectedUrl);
  const code = urlObj.searchParams.get('code');

  if (!code) {
    throw new Error('❌ OAuth code not found in redirect URL');
  }

  console.log(`✅ Authorization code retrieved`);
  return code;
}

// This function exchanges the authorization code for a refresh token
async function getRefreshToken(code: string) {
  console.log(`Requesting refresh token using code: ${code}`);

  const context = await request.newContext();

  const response = await context.post(process.env.SFDC_TOKEN_URL as string, {
    form: {
      grant_type: 'authorization_code',
      client_id: process.env.SFDC_CLIENT_ID as string,
      client_secret: process.env.SFDC_CLIENT_SECRET as string,
      username: process.env.SFDC_USERNAME as string,
      password: process.env.SFDC_PASSWORD as string + process.env.SFDC_TOKEN as string,
      code: code,
      redirect_uri: process.env.SFDC_REDIRECT_URI!,
    },
  });

  if (response.status() !== 200) {
    const errorText = await response.text();
    console.error(`❌ Failed to fetch access token: ${errorText}`);
    throw new Error(`Failed to fetch access token`);
  }

  const json = await response.json();
  console.log(`✅ Refresh token received`);
  return json.refresh_token;
}

// This function updates the .env file with the new refresh token
function updateEnvFileWithRefreshToken(token: string): void {
  console.log(`Updating .env file with new refresh token`);

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  let updated = false;

  // Update the line if refresh token key is already present
  const updatedLines = lines.map(line => {
    if (line.startsWith('SFDC_REFRESH_TOKEN=')) {
      updated = true;
      return `SFDC_REFRESH_TOKEN=${token}`;
    }
    return line;
  });

  // If refresh token is not present in .env, append it
  if (!updated) {
    updatedLines.push(`SFDC_REFRESH_TOKEN=${token}`);
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log('✅ .env updated with new refresh token');
}

// Entry point of the script
async function main() {
  console.log(`Launching browser in headful mode`);
  const browser = await chromium.launch({ headless: false }); // 👈 headless is false to allow visual debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Get authorization code
    const code = await getAuthCode(page);

    // Step 2: Get refresh token using the auth code
    const refreshToken = await getRefreshToken(code);

    // Step 3: Update .env file with new refresh token
    updateEnvFileWithRefreshToken(refreshToken);
  } catch (err) {
    console.error(`❌ Error occurred: ${(err as Error).message}`);
  } finally {
    // Wait for a moment so you can visually verify before browser closes
    console.log(`Waiting for 5 seconds before closing the browser...`);
    await new Promise(res => setTimeout(res, 5000));
    
    await browser.close();
    console.log(`Browser closed`);
  }
}

main();
