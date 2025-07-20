import { test , expect } from "@playwright/test";
import { normalLogin } from "../utils/sfLogin";
import { createAccount } from "../utils/createAccount";


test('Validate Account details in Salesforce UI', async ({page}) => {
    const accName='TestAccountName';
    const objectId = await createAccount(accName);
    const baseUrl = process.env.SFDC_BASE_URL; // Ensure dotenv is loaded
    const accountUrl = `${baseUrl}/lightning/r/Account/${objectId}/view`;

    console.log(accountUrl);
    console.log(objectId);
    await normalLogin(page);
    await page.goto(accountUrl);
    await page.waitForTimeout(5000);

    page.close();
    
});