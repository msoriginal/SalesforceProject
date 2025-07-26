import {test, expect} from '@playwright/test';
import { ContactPage } from '../../pageObjects/ContactPage';
import { LoginPage } from '../../pageObjects/LoginPage';
import { BasePage } from '../../pageObjects/BasePage';
import { Utility } from '../../utils/utility';
import { deleteRecord } from '../../utils/apis';


let createdContactId: string | undefined;

test('Create New Contact in Salesforce', async ({ page }) => {
    const basePage = new BasePage(page); 
    const contactPage = new ContactPage(page);
    const loginPage = new LoginPage(page);

   
    await test.step('Login to Salesforce org', async () => {
        await loginPage.loginWithOauth();
    });
    await test.step('Open Lightning Sales App', async () => {
        await page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSales`);
    });
    await test.step('Open new contact form', async () => {
        await contactPage.openNewContactForm();
    });
    const contactData = {
        firstName: Utility.getRandomString(5),
        lastName: Utility.getRandomString(5),
        email: `${Utility.getRandomString(5)}@example.com`,
        salutation: 'Mr.',
        accountName: 'Barton Media'
    };  

    await test.step('Fill contact details', async () => {
        await contactPage.fillContactDetails(contactData);
    });
    await test.step('Submit contact form', async () => {
        await contactPage.saveContact();
    });
    basePage.takeScreenshot('contact_creation_success', true);
    await test.step('Get and log created Contact ID', async () => {
        createdContactId = await basePage.getRecordId();
        console.log('Created Contact ID:', createdContactId);
    });


});

test.afterAll(async () => {
    await test.step('Deleting record', async () => {
        if (createdContactId) {          
            await deleteRecord('Contact', createdContactId);
        }
    });
});