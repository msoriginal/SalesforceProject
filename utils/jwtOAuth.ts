// utils/jwtOAuth.ts
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';
import { request } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });


export type JwtOverrides = {
  username?: string;
  client_id?: string;
  privateKeyPath?: string;
  aud?: string;
  tokenUrl?: string;
};

function ensurePrivateKey(pathToKey: string): string {
  if (!fs.existsSync(pathToKey)) {
    throw new Error(`Private key not found at ${pathToKey}`);
  }
  return fs.readFileSync(pathToKey, 'utf8');
}

// Exported function that returns the token response JSON
export async function getJwtAccessToken(overrides: JwtOverrides = {}): Promise<any> {
  const username = overrides.username || process.env.SFDC_USERNAME;
  const clientId = overrides.client_id || process.env.SFDC_CLIENT_ID;
  const aud = overrides.aud || process.env.SFDC_AUD || 'https://login.salesforce.com';
  const tokenUrl = overrides.tokenUrl || process.env.SFDC_TOKEN_URL || `${aud}/services/oauth2/token`;
  const privateKeyPath = overrides.privateKeyPath || process.env.PATH_TO_PRIVATE_KEY || path.resolve(__dirname, '../certs/private_key.pem');

  if (!clientId) throw new Error('client_id (SFDC_CLIENT_ID) is required');
  if (!username) throw new Error('username (SFDC_USERNAME) is required');

  const privateKey = ensurePrivateKey(privateKeyPath);

  // Build JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientId,
    sub: username,
    aud: aud,
    exp: now + 3 * 60 // 3 minutes
  };

  const signedJwt = jwt.sign(payload as string | object | Buffer, privateKey, { algorithm: 'RS256' });

  const ctx = await request.newContext();
  const response = await ctx.post(tokenUrl, {
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt
    }
  });

  const text = await response.text();
  if (response.status() !== 200) {
    // throw an error so callers can handle it
    throw new Error(`Token request failed: ${response.status()} - ${text}`);
  }

  const json = JSON.parse(text);
  return json;
}

// If the script is run directly, print the token response to console
if (require.main === module) {
  (async () => {
    try {
      const json = await getJwtAccessToken();
      console.log('Access token response:', json);
    } catch (err: any) {
      console.error('Error getting JWT access token:', err.message || err);
      process.exit(1);
    }
  })();
}