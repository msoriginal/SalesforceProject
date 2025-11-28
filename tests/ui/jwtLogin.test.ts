import { test, expect } from '@playwright/test';
import ConnectionManager from '../../utils/connectionManager';
import { LoginPage } from '../../pageObjects/LoginPage';

test('JWT login using connection manager user', async ({ page }) => {
  const cm = new ConnectionManager();
  const users = cm.listUsers();

  if (!users || users.length === 0) {
    test.skip(true, 'No users configured in credentials.json; copy credentials.example.json to credentials.json and add at least one user');
    return;
  }

  // Allow selecting a specific user via env var TEST_USER_KEY, otherwise pick first
  const userKey = process.env.TEST_USER_KEY || users[0];

  const loginPage = new LoginPage(page);
  // This will throw if login fails
  await (loginPage as any).loginWithJwt(userKey);

  // Basic validation: page should not be on the Salesforce login domain
  const currentUrl = page.url();
  expect(currentUrl.includes('login.salesforce.com')).toBeFalsy();
})
