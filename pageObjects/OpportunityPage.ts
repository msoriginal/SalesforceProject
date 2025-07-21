import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class OpportunityPage extends BasePage {
    private newButton;
    private nextButton;
    private saveButton;
    private cancelButton;
    private opportunityNameInput;
    private closeDateInput;
    private stageSelect;

    constructor(page: Page) {
        super(page);
        this.newButton = page.getByRole('button', { name: 'New' });
        this.nextButton = page.locator('button[title="Next"]');
        this.saveButton = page.locator('button[name="SaveEdit"]');
        this.cancelButton = page.locator('button[title="Cancel"]');
        this.opportunityNameInput = page.locator('input[name="Name"]');
        this.closeDateInput = page.locator('input[name="CloseDate"]');
        this.stageSelect = page.locator('button[aria-label="Stage"]');
    }

    async openNewOpportunityForm() {
        await this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/o/Opportunity/list`);
        await this.newButton.click();
    }

    async fillOpportunityDetails(opportunityData: any) {
        await this.opportunityNameInput.fill(opportunityData.name);
        await this.closeDateInput.fill(opportunityData.closeDate);
        await this.selectPicklistByLabel('Stage', opportunityData.stage);
        await this.setLookupField('Account Name', opportunityData.accountName);
    }

    async saveOpportunity() {
        await this.saveButton.click();
    }

    async cancelOpportunityCreation() {
        await this.cancelButton.click();
    }
}