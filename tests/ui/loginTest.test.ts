import {test,expect} from '@playwright/test';
import { LoginPage } from '../../pageObjects/LoginPage';
import * as dotenv from 'dotenv';

dotenv.config();

test('Login test', async ({page}) => {
    const loginPage = new LoginPage(page);
    await page.goto (`${process.env.SFDC_BASE_URL}/login.jsp`);
    await loginPage.login(process.env.SFDC_USERNAME!, process.env.SFDC_PASSWORD!);
    await page.waitForTimeout(10000);
    expect(await page.title()).toBe('Home | Salesforce');
    
})

test('OAuth Login test', async ({page}) => {
    const loginPage = new LoginPage(page);
    //await page.goto (`${process.env.SFDC_BASE_URL}/login.jsp`);
    await loginPage.oauthLogin();
    await page.waitForTimeout(1000);
    expect(await page.title()).toBe('Home | Salesforce');
    
})