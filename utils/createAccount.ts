import { request } from '@playwright/test';
import { getAccessToken } from './apis';




export async function createAccount(accountName: string): Promise<string> {
    const token = await getAccessToken();
    const context = await request.newContext();

    const response = await context.post(`${process.env.SFDC_BASE_URL}/services/data/v59.0/sobjects/Account`,{
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: {
            Name: accountName
        }
    });

    if(response.status()!==201) {
        throw new Error(`Failed to create Account : ${await response.text()}`);
    }
    const json=await response.json();
    console.log(`Account created! ID: ${json.id}`);
    return json.id;
}