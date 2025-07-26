import {request } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export async function getWebAccessToken(){            
            const context = await request.newContext();
            const response = await context.post(process.env.SFDC_TOKEN_URL as string,{
                form: {
                    grant_type: 'refresh_token',
                    client_id: process.env.SFDC_CLIENT_ID as string,
                    client_secret: process.env.SFDC_CLIENT_SECRET as string,
                    refresh_token: process.env.SFDC_REFRESH_TOKEN as string,
                    redirect_uri: process.env.SFDC_REDIRECT_URI!      
                }
            });
        
            if (response.status()!==200){
                throw new Error (`Failed to fetch access token: ${await response.text()}`);
        
            }
            const json = await response.json();
            return json;
    }

export async function getAccessToken(): Promise <string> {
    const context = await request.newContext();
    const response = await context.post(process.env.SFDC_TOKEN_URL as string,{
        form: {
            grant_type: 'password',
            client_id: process.env.SFDC_CLIENT_ID as string,
            client_secret: process.env.SFDC_CLIENT_SECRET as string,
            username: process.env.SFDC_USERNAME as string,
            password: process.env.SFDC_PASSWORD as string + process.env.SFDC_TOKEN as string

        }
    });

    if (response.status()!==200){
        throw new Error (`Failed to fetch access token: ${await response.text()}`);

    }
    const json = await response.json();
    return json.access_token;
    //return json;
}

export async function deleteRecord(object: string, recordId: string): Promise<void> {
      if (recordId) {
             
            const accessToken = await getAccessToken();
            const instanceUrl = process.env.SFDC_BASE_URL as string  ;
           
            console.log(`Deleting ${object} with ID: ${recordId}`);
    
            // Delete the Account record
            const deleteResponse = await fetch(
                `${instanceUrl}/services/data/v58.0/sobjects/${object}/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );
            if (deleteResponse.ok) {
                console.log(`Deleted ${object}: ${recordId}`);
            } else {
                console.error(`Failed to delete ${object}: ${recordId}`);
            }
        }
}

