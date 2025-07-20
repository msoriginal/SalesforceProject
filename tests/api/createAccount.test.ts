import {test, expect, request } from '@playwright/test';
import { getAccessToken } from '../../utils/apis';
import * as dotenv from 'dotenv';

dotenv.config();

test('@api Create SF Account via API', async({}) => {
 

    const token = await getAccessToken();
    const context = await request.newContext();

    const response =await context.post(`${process.env.SFDC_BASE_URL}/services/data/v59.0/sobjects/Account`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'COntent-Type': 'application/json'
        },
        data: {
            Name: 'Playwright Test Account Abhishek'
        }
    });

    expect(response.status()).toBe(201);

});