# SalesforceProject

A lightweight test automation framework built with **Playwright** and **TypeScript** for automating key Salesforce UI workflows.

## 🚀 Project Overview

This project automates UI interactions with Salesforce pages such as login, object creation, and navigation. It is designed for easy scalability and maintainability, following industry-standard testing practices.

## 📦 Tech Stack

- **Playwright** – Fast and reliable end-to-end browser automation
- **TypeScript** – Static typing for improved code quality
- **Node.js** – JavaScript runtime for executing the tests
- **dotenv** – Secure management of environment variables

## 🧪 Features

- Automated login to Salesforce using environment-based credentials
- Navigation and validation of Salesforce standard object pages
- Utility functions for common actions
- Screenshot capture on test failure
- Extensible base class and utility support

## 📁 Project Structure

SalesforceProject/
├── tests/ # Test cases
├── pageObjects/ # Page Object Models
├── utils/ # Utility classes (e.g., random string/number generator)
├── .env # Environment variables (ignored in Git)
├── .gitignore
├── playwright.config.ts # Playwright configuration
├── package.json
└── tsconfig.json


## 🔐 Environment Variables

Create a `.env` file in the root directory (not committed to Git) with the following:

SFDC_BASE_URL=https://your-instance.salesforce.com
SFDC_USERNAME=your-username
SFDC_PASSWORD=your-password


You can also set these variables via the system environment to enhance security.

## ▶️ Running Tests

1. Install dependencies:

   ```bash
   npm install
2. Run the tests:
npx playwright test

3. To view test reports:
npx playwright show-report

🖼️ Screenshots on Failure
Screenshots and trace files are automatically captured on failure and stored under the test-results/ folder.

💡 Future Enhancements
API + UI integration testing

CI/CD integration (GitHub Actions, Azure DevOps)

Parallel test execution and tagging

Happy Testing! 🎯
