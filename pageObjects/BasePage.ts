import { Page, Locator } from '@playwright/test';

import { getAccessToken } from '../utils/apis'; // Adjust the import path as necessary
import * as dotenv from 'dotenv';
import { NavigationHelper } from './NavigationHelper';

dotenv.config();

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(): Promise<NavigationHelper> {
        return new NavigationHelper(this.page)
    }

    async waitForElement(selector: string | Locator, state: 'visible' | 'attached' = 'visible') {
        const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
        await locator.waitFor({ state });
    }

     async click(element: Locator) {
    await element.click();
  }

  async fill(element: Locator, value: string) {
    await element.click();
    await element.clear();
    await element.fill(value);
  }

  async getText(element: Locator): Promise<string> {
    return await element.innerText();
  }

  async isVisible(element: Locator): Promise<boolean> {
    return await element.isVisible();
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

    // Add more shared methods as needed
}