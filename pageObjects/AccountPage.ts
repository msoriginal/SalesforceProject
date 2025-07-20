import {Page} from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage{
    private newButton;
    private nextButton;
    //private parentAccount;

    constructor(page: Page){
        super(page);
        this.page = page;
        this.newButton = page.getByRole('button', { name: 'New' });
        this.nextButton = page.getByRole('button', { name: 'Next' });
        
    }

    async createNewAccount(accountData: any) {
        await this.openNewAccountForm();
        await this.fillAccountDetails(accountData);
        await this.submitForm();

    }
    async openNewAccountForm(){
        await this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/o/Account/list`);
        await this.newButton.click();
        await this.nextButton.click();
        await this.page.locator('.record-body-container').waitFor({state: 'visible'});
    }

    async fillAccountDetails(accountData: any){
        await this.page.locator('input[name="Name"]').waitFor({ state: 'visible' }); 

        await this.page.locator('input[name="Name"]').fill(accountData.name);
        await this.page.locator('input[name="AnnualRevenue"]').fill(accountData.annualRevenue.toString());
       
        await this.page.fill('input[name="Phone"]', accountData.phone);
        await this.page.fill('input[name="Website"]', accountData.website);

        await this.setLookupField('Parent Account',accountData.parentAccount);
        await this.selectPicklistByLabel('Ownership', accountData.ownership);
        await this.selectPicklistByLabel('Rating', accountData.rating);
        await this.selectPicklistByLabel('Industry', accountData.industry);
    }

    async selectPicklistByLabel(label: string, optionText: string) {
        // Find the picklist button by its aria-label (usually the field label)
        const picklistButton = this.page.locator(`button[aria-label="${label}"]`);
        await picklistButton.waitFor({ state: 'visible' });
        await picklistButton.click();

        // Wait for the dropdown and select the option by visible text
        const option = this.page.locator(`//lightning-base-combobox-item[@role='option']//span[text()="${optionText}"]`);
        await option.waitFor({ state: 'visible' });
        await option.click();
    }

    async setLookupField(lookupFieldName:string, value: string) {
        const lookupField = this.page.locator(`//records-record-layout-item[@field-label="${lookupFieldName}"]//input`);
    
        await lookupField.click();
        await lookupField.fill(value);
        await lookupField.click();
        await this.page.locator(`//li/lightning-base-combobox-item[@role='option']//lightning-base-combobox-formatted-text[@title='${value}']`).click();
        
    }
    async submitForm() {
        await this.page.click('button[name="SaveEdit"]');
    }

    async getAccountId() {
        // Wait for navigation to the Account view page
        await this.page.waitForURL(/\/lightning\/r\/Account\/[a-zA-Z0-9]+\/view/);

        // Extract the Account ID from the URL
        const url = this.page.url();
        const match = url.match(/\/lightning\/r\/Account\/([a-zA-Z0-9]+)\/view/);
        if (match && match[1]) {
            return match[1];
        }
        throw new Error('Account ID not found in URL');
    }
}