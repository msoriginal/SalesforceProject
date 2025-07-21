import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class ContactPage extends BasePage {
    private newButton;
    private nextButton;
    private saveButton;
    private cancelButton;
    private firstNameInput;
    private lastNameInput;
    private emailInput;

    constructor(page: Page) {
        super(page);
        this.newButton = page.getByRole('button', { name: 'New' });
        this.nextButton = page.locator('button[title="Next"]');
        this.saveButton = page.locator('button[name="SaveEdit"]');
        this.cancelButton = page.locator('button[title="Cancel"]');
        this.firstNameInput = page.locator('input[name="firstName"]');
        
        this.lastNameInput = page.locator('input[name="lastName"]');
        this.emailInput = page.locator('input[name="Email"]');
    }

    async openNewContactForm() {
        //https://d2x000000d6hieas-dev-ed.lightning.force.com/lightning/o/Contact/list
        await this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/o/Contact/list`);
        await this.newButton.click();
        
    }

    async fillContactDetails(contactData: any) {
        await this.firstNameInput.fill(contactData.firstName);
        await this.lastNameInput.fill(contactData.lastName);
        await this.emailInput.fill(contactData.email);
        await this.selectPicklistByLabel('Salutation', contactData.salutation);
        await this.setLookupField('Account Name', contactData.accountName);
    }

    async saveContact() {
        await this.page.click('button[name="SaveEdit"]');
    }

    async cancelContactCreation() {
        await this.cancelButton.click();
    }
   
    
}