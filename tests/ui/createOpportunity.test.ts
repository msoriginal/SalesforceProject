import { OpportunityPage } from "../../pageObjects/OpportunityPage";    
import {test, expect} from '@playwright/test';
import { LoginPage } from '../../pageObjects/LoginPage';
import { BasePage } from '../../pageObjects/BasePage';
import { Utility } from '../../utils/utility';
import { deleteRecord } from '../../utils/apis';

let createdOpportunityId: string | undefined;

test('Create Opportunity', async ({ page }) => {

    const basePage = new BasePage(page);
    const loginPage = new LoginPage(page);
    const opportunityPage = new OpportunityPage(page);  

    // Login to Salesforce
    await test.step('Login to Salesforce org', async () => {
        await loginPage.login();
    });
    // Navigate to the Lightning Sales App
    await test.step('Open Lightning Sales App', async () => {   
        await page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSales`);
    });
    // Navigate to the Opportunities page
    await opportunityPage.openNewOpportunityForm();
    // Define the opportunity data
    const opportunityData = {
        name: 'Opportunity'+ Utility.getRandomString(5),
        closeDate: '31/12/2025',
        stage: 'Prospecting',
        accountName: 'Barton Media'
    };

    // Fill in the opportunity details
    await test.step('Fill opportunity details', async () => {
    await opportunityPage.fillOpportunityDetails(opportunityData);
    });
    // Save the opportunity
    await test.step('Submit opportunity form', async () => {
    await opportunityPage.saveOpportunity();
    });

    
    // Verify that the Opportunity was created successfully
    const successMessage = await page.textContent('.slds-notify__content');
    console.log(successMessage);
    test.step('Verify Opportunity creation', async () => {
    expect(successMessage).toContain('Opportunity "' + opportunityData.name + '" was created');
    basePage.takeScreenshot('opportunity_creation_success', true);
    });
    // Get and log the created Opportunity ID
    await test.step('Get and log created Opportunity ID', async () => {
        const createdOpportunityId = await basePage.getRecordId();
        console.log('Created Opportunity ID:', createdOpportunityId);
    });

});
test.afterAll(async () => {
    await test.step('Deleting record', async () => {
        // Assuming you have a way to get the created Opportunity ID
    
        if (createdOpportunityId) {          
            await deleteRecord('Opportunity', createdOpportunityId);
        }
    });
});