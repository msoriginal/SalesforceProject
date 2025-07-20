import { BrowserContext, Page, request } from "@playwright/test";
import * as dotenv from 'dotenv';

dotenv.config();

export async function normalLogin(page: Page): Promise<void>{
    //const page = await context.newPage();
    await page.goto(`${process.env.SFDC_BASE_URL}/login.jsp`);

    await page.fill('#username', process.env.SFDC_USERNAME as string);
    await page.fill('#password', process.env.SFDC_PASSWORD as string);
    await page.click('#Login');

    await page.waitForLoadState('domcontentloaded');


}
export async function oauthLogin(page: Page): Promise<void>{
    /*const context = await request.newContext();
    const response = await context.post(process.env.SFDC_TOKEN_URL as string,{
        form: {
            grant_type: 'authorization_code',
            client_id: process.env.SFDC_CLIENT_ID as string,
            client_secret: process.env.SFDC_CLIENT_SECRET as string,
            redirect_uri: process.env.SFDC_REDIRECT_URI as string,
            code: process.env.SFDC_CODE as string
        }
    });
    if (response.status() !== 200) {
        throw new Error(`Failed to fetch access token: ${await response.text()}`);
    }

    const json = await response.json();
    */
    const accessToken = process.env.SFDC_ACCESS_TOKEN as string;
    const instanceUrl = process.env.SFDC_BASE_URL as string;
    const frontDoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;
    await page.goto(frontDoorUrl);
}