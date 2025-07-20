import { Page } from '@playwright/test';
import { oauthLogin } from '../utils/sfLogin';
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
    
    async getAuthCode() {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: process.env.SFDC_CLIENT_ID!,
          redirect_uri: process.env.SFDC_REDIRECT_URI!,
          scope: 'openid', // add other scopes if needed
        });
        const authUrl = `${process.env.SFDC_BASE_URL}/services/oauth2/authorize?${params.toString()}`;
    
        await this.page.goto(authUrl);
    
        // Automate the login form if prompted
        await this.page.fill('input#username', process.env.SFDC_USERNAME!);
        await this.page.fill('input#password', process.env.SFDC_PASSWORD!);
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle' }),
            this.page.click('input#Login'),
        ]);
    
        // If Salesforce asks for authorization, click "Allow"
        const allowButton = this.page.locator('button:has-text("Allow")');
        if (await allowButton.isVisible()) {
            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'networkidle' }),
                allowButton.click(),
            ]);
        }
    
        // Wait for redirect and extract code
        const redirectedUrl = this.page.url();
        const urlObj = new URL(redirectedUrl);
        const code = urlObj.searchParams.get('code');
        if (!code) {
            throw new Error('OAuth code not found in redirect URL');
        }
        return code;
    }
    async oauthLogin() {
        const accessToken = process.env.SFDC_ACCESS_TOKEN as string;
        const instanceUrl = process.env.SFDC_BASE_URL as string;
        const frontDoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;
        const res = await fetch(`${instanceUrl}/home/home.jsp`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            redirect: 'manual'
            });

        const cookies = res.headers.get('set-cookie'); // Parse this for session info

        // Extract the 'sid' value from the set-cookie string
        let sidValue = '';
        if (cookies) {
            const match = cookies.match(/sid=([^;]+)/);
            if (match) {
                sidValue = match[1];
            } else {
                throw new Error('sid cookie not found in set-cookie header');
            }
        } else {
            throw new Error('No set-cookie header found in response');
        }

        // 3. Set the cookie in Playwright
        await this.page.context().addCookies([{
            name: 'sid', // Salesforce session cookie name
            value: sidValue,
            domain: '.my.salesforce.com',
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        }]);
        await this.page.goto(frontDoorUrl);
    }
}