import {test, expect} from '@playwright/test';
import { AccountPage } from '../../pageObjects/AccountPage';
import { LoginPage } from '../../pageObjects/LoginPage';
import * as dotenv from 'dotenv';
import { getAccessToken } from '../../utils/apis';
import { BasePage } from '../../pageObjects/BasePage';
import { deleteRecord } from '../../utils/apis';

dotenv.config();
let createdAccountId: string | undefined;
 

export function generateRandomName(): string {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Hannah', 'Isaac', 'Julia'];
    const lastNames = ['Johnson', 'Smith', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${randomFirstName} ${randomLastName}`;
}

test('@regression Create New Account in Salesforce', async ({ page }) => {
    const basePage = new BasePage(page); 
    const accountPage = new AccountPage(page);
    const loginPage = new LoginPage(page);

   
    await test.step('Login to Salesforce org', async () => {
        await loginPage.login();
    });

    const accountData = {
        name: generateRandomName(),
        annualRevenue: 1000000,
        industry: 'Technology',
        phone: '1234567890',
        website: 'https://test.com',
        rating: 'Hot',
        billingStreet: '123 Test St',
        billingCity: 'Test City',
        billingState: 'CA',
        billingPostalCode: '12345',
        billingCountry: 'USA',
        parentAccount: 'Barton Media',
        ownership: 'Public'
        
    };
    await test.step('Open Lightning Sales App', async () => {
        await page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSales`);
    });

    await test.step('Open new account form', async () => {
        await accountPage.openNewAccountForm();
    });

    await test.step('Fill account details', async () => {
        await accountPage.fillAccountDetails(accountData);
    });

    await test.step('Submit account form', async () => {
        await accountPage.submitForm();
    });

    basePage.takeScreenshot('account_creation_success', true);
    
    await test.step('Get and log created Account ID', async () => {
        createdAccountId = await basePage.getRecordId();
        console.log('Created Account ID:', createdAccountId);
    });

});
//test.afterEach(async () => {
test.afterAll(async () => {
    await test.step('Deleting record', async () => {
        if (createdAccountId) {          
            await deleteRecord('Account', createdAccountId);
        }
    });
});