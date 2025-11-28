import { Page } from '@playwright/test';
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
    /**
     * Login using JWT (frontdoor) flow for a specific user key from credentials.json
     * @param userKey optional key from credentials.json; if omitted, uses SFDC_USERNAME from env
     */
    async loginWithJwt(userKey?: string) {
        // Lazy import to avoid circular dependencies at module load
        const { default: ConnectionManager } = await import('../utils/connectionManager');
        const { getJwtAccessToken } = await import('../utils/jwtOAuth');

        const cm = new ConnectionManager();

        // If a userKey is provided, get that user's creds; otherwise fallback to env
        let overrides: any = {};
        if (userKey) {
            const creds = cm.getForLogin(userKey);
            if (!creds) {
                throw new Error(`User '${userKey}' not found in credentials.json`);
            }
            overrides = {
                username: creds.username || creds.user || creds.email,
                client_id: creds.client_id || creds.clientId,
                privateKeyPath: creds.PATH_TO_PRIVATE_KEY || creds.privateKeyPath,
                aud: creds.aud,
                tokenUrl: creds.tokenUrl
            };
        }

        try {
            const response = await getJwtAccessToken(overrides);
            const accessToken = response.access_token;
            const instanceUrl = response.instance_url;
            const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;

            console.log(`Navigating to frontdoor.jsp`);

            await this.page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded' });

            await this.page.waitForURL(url =>
                url.href.includes('/home/home.jsp') ||
                url.href.includes('/lightning/page/home') ||
                url.href.includes('/lightning') ||
                url.href.includes('/one/one.app')
            , { timeout: 60000 });

            const currentUrl = this.page.url();
            if (currentUrl.includes('login.salesforce.com') || await this.page.locator('text="To access this page, you have to log in to Salesforce."').isVisible()) {
                console.error('UI Login failed: Still on the Salesforce login page after attempting frontdoor.jsp login.');
                await this.page.screenshot({ path: 'ui_login_failure.png' });
                throw new Error('Salesforce UI login failed: Redirected to login page.');
            }

            console.log('Successfully logged into Salesforce UI via JWT!');
            console.log(`Current URL after UI login: ${this.page.url()}`);
        } catch (err: any) {
            console.error(`An error occurred during Salesforce JWT UI login: ${err.message}`);
            await this.page.screenshot({ path: 'ui_jwt_login_error_debug.png' });
            throw err;
        }
    }

    /**
     * Login as another user using admin credentials (JWT impersonation using connected app cert).
     * @param targetUserKey key for the target user in credentials.json
     * @param adminUserKey optional key for the admin entry in credentials.json; if omitted, will attempt to use env/default JWT flow
     */
    async loginAs(targetUserKey: string, adminUserKey?: string) {
        // Lazy imports
        const { default: ConnectionManager } = await import('../utils/connectionManager');
        const { getJwtAccessToken } = await import('../utils/jwtOAuth');

        const cm = new ConnectionManager();

        const targetCreds = cm.getForLogin(targetUserKey);
        if (!targetCreds) throw new Error(`Target user '${targetUserKey}' not found in credentials.json`);

        // If adminUserKey provided, use admin's client_id/privateKey to request a JWT for the target user
        if (adminUserKey) {
            const adminCreds = cm.getForLogin(adminUserKey);
            if (!adminCreds) throw new Error(`Admin user '${adminUserKey}' not found in credentials.json`);

            const overrides: any = {
                username: targetCreds.username || targetCreds.user || targetCreds.email,
                client_id: adminCreds.client_id || adminCreds.clientId,
                privateKeyPath: adminCreds.PATH_TO_PRIVATE_KEY || adminCreds.privateKeyPath,
                aud: targetCreds.aud || adminCreds.aud || process.env.SFDC_AUD,
                tokenUrl: targetCreds.tokenUrl || adminCreds.tokenUrl || process.env.SFDC_TOKEN_URL
            };

            try {
                const response = await getJwtAccessToken(overrides);
                const accessToken = response.access_token;
                const instanceUrl = response.instance_url;
                const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;

                console.log(`Navigating to frontdoor.jsp as ${targetUserKey}`);
                await this.page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded' });

                await this.page.waitForURL(url =>
                    url.href.includes('/home/home.jsp') ||
                    url.href.includes('/lightning/page/home') ||
                    url.href.includes('/lightning') ||
                    url.href.includes('/one/one.app')
                , { timeout: 60000 });

                // Basic check
                const currentUrl = this.page.url();
                if (currentUrl.includes('login.salesforce.com')) {
                    throw new Error('Login-as frontdoor redirect landed on login page');
                }

                console.log(`Successfully logged in as ${targetUserKey}`);
                return;
            } catch (err: any) {
                console.error(`Failed login-as via admin JWT: ${err.message || err}`);
                throw err;
            }
        }

        // Fallback: attempt a normal JWT login for the target user
        await this.loginWithJwt(targetUserKey);
    }

    /**
     * Login a user by their username (email). Looks up credentials.json for a matching entry; if none found,
     * attempts JWT login using default env/client settings.
     * @param username user's username/email
     * @param adminUserKey optional admin key to perform login-as impersonation
     */
    async loginByUsername(username: string, adminUserKey?: string) {
        const { default: ConnectionManager } = await import('../utils/connectionManager');
        const { getJwtAccessToken } = await import('../utils/jwtOAuth');

        const cm = new ConnectionManager();
        const userKey = cm.findUserKeyByUsername(username);
        if (userKey) {
            // If admin provided, use loginAs which will impersonate
            if (adminUserKey) {
                return await this.loginAs(userKey, adminUserKey);
            }
            return await this.loginWithJwt(userKey);
        }

        // Not found in credentials.json — attempt JWT using username and default client/keys from env
        try {
            const response = await getJwtAccessToken({ username });
            const accessToken = response.access_token;
            const instanceUrl = response.instance_url;
            const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;

            console.log(`Navigating to frontdoor.jsp for username ${username}`);
            await this.page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded' });

            await this.page.waitForURL(url =>
                url.href.includes('/home/home.jsp') ||
                url.href.includes('/lightning/page/home') ||
                url.href.includes('/lightning') ||
                url.href.includes('/one/one.app')
            , { timeout: 60000 });

            const currentUrl = this.page.url();
            if (currentUrl.includes('login.salesforce.com') || await this.page.locator('text="To access this page, you have to log in to Salesforce."').isVisible()) {
                console.error('UI Login failed: Still on the Salesforce login page after attempting frontdoor.jsp login.');
                await this.page.screenshot({ path: 'ui_login_failure.png' });
                throw new Error('Salesforce UI login failed: Redirected to login page.');
            }

            console.log('Successfully logged into Salesforce UI via JWT!');
            console.log(`Current URL after UI login: ${this.page.url()}`);
        } catch (err: any) {
            console.error(`An error occurred during Salesforce JWT UI login by username: ${err.message}`);
            await this.page.screenshot({ path: 'ui_login_error_by_username.png' });
            throw err;
        }
    }

}

