// navigationHelper.ts
import { Page } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export class NavigationHelper {
  constructor(private page: Page) {}

  application(): this {
    console.log("Navigating to application root");
    return this;
  }

  async lightningSales(): Promise<this> {
    console.log("Navigating to Lightning Sales App");
    await this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSales`);
    await this.page.waitForSelector('div.slds-global-header'); // Optional but recommended
    return this;
  }

  async lightningConsole(): Promise<this> {
    console.log("Navigating to Lightning Console App");
    await this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSalesConsole`);
    await this.page.waitForSelector('div.slds-global-header'); // Adjust if needed
    return this;
  }

  async salesforcePage(resourceUrl: string): Promise<this> {
    console.log("Navigating to Salesforce page:", resourceUrl);
    await this.page.goto(`${process.env.SFDC_BASE_URL}/${resourceUrl}`);
    return this;
  }

  async url(customUrl: string): Promise<this> {
    console.log(`Navigating to custom URL: ${customUrl}`);
    await this.page.goto(customUrl);
    return this;
  }
}
