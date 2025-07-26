import { Page, request } from '@playwright/test';
import { getWebAccessToken } from '../utils/apis';
import { BasePage } from './BasePage';


export class LoginPage extends BasePage {
    private usernameInput = '#username';
    private passwordInput = '#password';
    private loginButton = '#Login';

    constructor(page: Page){
        super(page);
    }

    // Overload signatures
    async login(): Promise<void>;
    async login(username: string, password: string): Promise<void>;

    // Single implementation
    async login(username?: string, password?: string): Promise<void> {
        await this.page.goto(`${process.env.SFDC_BASE_URL!}/login.jsp`);

        const user = username ?? process.env.SFDC_USERNAME!;
        const pass = password ?? process.env.SFDC_PASSWORD!;

        await this.page.fill(this.usernameInput, user);
        await this.page.fill(this.passwordInput, pass);
        await this.page.click(this.loginButton);
        await this.page.waitForLoadState('domcontentloaded');
    }

    
    async loginWithOauth(){
        const response=await getWebAccessToken();
        const accessToken = response.access_token;
        const instanceUrl = response.instance_url;
        const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;
        
        
        console.log(`Navigating to frontdoor.jsp`);
        
        try {
        await this.page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded' });

        // Wait for the URL to change to a typical Salesforce home page URL
        await this.page.waitForURL(url =>
            url.href.includes('/home/home.jsp') ||
            url.href.includes('/lightning/page/home') ||
            url.href.includes('/lightning') ||
            url.href.includes('/one/one.app')
        , { timeout: 60000 });

        // Verify that we are not on the login page after the wait
        const currentUrl = this.page.url();
        if (currentUrl.includes('login.salesforce.com') || await this.page.locator('text="To access this page, you have to log in to Salesforce."').isVisible()) {
            console.error('UI Login failed: Still on the Salesforce login page after attempting frontdoor.jsp login.');
            await this.page.screenshot({ path: 'ui_login_failure.png' });
            throw new Error('Salesforce UI login failed: Redirected to login page.');
        }

        console.log('Successfully logged into Salesforce UI!');
        console.log(`Current URL after UI login: ${this.page.url()}`);

    } catch (error: any) {
        console.error(`An error occurred during Salesforce UI login: ${error.message}`);
        await this.page.screenshot({ path: 'ui_login_error_debug.png' });
        throw new Error(`Failed to log into Salesforce UI: ${error.message}`);
    }

    }
}

