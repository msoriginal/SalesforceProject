import { Page, Locator } from '@playwright/test';
import { getAccessToken } from '../utils/apis'; // Adjust the import path as necessary

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(url: string) {
        await this.page.goto(url);
    }

    async waitForElement(selector: string | Locator, state: 'visible' | 'attached' = 'visible') {
        const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
        await locator.waitFor({ state });
    }

    async click(selector: string) {
        await this.page.locator(selector).click();
    }

    async fill(selector: string, value: string) {
        await this.page.locator(selector).fill(value);
    }

    async getText(selector: string) {
        return await this.page.locator(selector).innerText();
    }

    async isVisible(selector: string) {
        return await this.page.locator(selector).isVisible();
    }

    async waitForNavigation(urlPart?: string) {
        if (urlPart) {
            await this.page.waitForURL(new RegExp(urlPart));
        } else {
            await this.page.waitForNavigation();
        }
    }

    async takeScreenshot(name: string, fullPage: boolean = false) {
        
        if(fullPage) {
            await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
        }
        else    
        await this.page.screenshot({ path: `screenshots/${name}.png` });
         
   
    }
     async getRecordId(): Promise<string> {
        const object='Contact'
        const recordViewUrlRegex = new RegExp(`\/([a-zA-Z0-9]+)\/view`);
        // Wait for navigation to the Account view page
        await this.page.waitForURL(new RegExp(`\/([a-zA-Z0-9]+)\/view`));

        // Extract the Account ID from the URL
        const url = this.page.url();
        const match = url.match(recordViewUrlRegex);
        if (match && match[1]) {
            return match[1];
        }
        throw new Error(`Record ID not found in URL`);
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
        const lookupField = this.page.locator(`//records-record-layout-lookup//label[text()='${lookupFieldName}']/..//input`);
    
        await lookupField.click();
        await lookupField.fill(value);
        await lookupField.click();
        await this.page.locator(`//li/lightning-base-combobox-item[@role='option']//lightning-base-combobox-formatted-text[@title='${value}']`).click();
        
    }

    async  deleteRecord(object: string, recordId: string): Promise<void> {
          if (recordId) {
                 
                const accessToken = await getAccessToken();
                const instanceUrl = process.env.SFDC_BASE_URL as string  ;
               
                
        
                // Delete the Account record
                const deleteResponse = await fetch(
                    `${instanceUrl}/services/data/v58.0/sobjects/Account/${recordId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                );
                if (deleteResponse.ok) {
                    console.log(`Deleted Account: ${recordId}`);
                } else {
                    console.error(`Failed to delete Account: ${recordId}`);
                }
            }
    }
    // Add more shared methods as needed
}