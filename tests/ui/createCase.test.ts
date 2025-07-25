import {test} from '@playwright/test';
import { BasePage } from '../../pageObjects/BasePage';
import { LoginPage } from '../../pageObjects/LoginPage';
import { Utility } from '../../utils/utility';
import { CasePage } from '../../pageObjects/CasePage';
import { NavigationHelper } from '../../pageObjects/NavigationHelper';
import { deleteRecord } from '../../utils/apis';

let createdRecordId: string | null;

test('@wip Create a new case in salesforce', async({page})=>{
    const basePage = new BasePage(page);
    const loginPage = new LoginPage(page);
    const casePage = new CasePage(page);
    const navi = new NavigationHelper(page);

    await test.step('Login to Salesforce org', async () => {
        await loginPage.login();
    });
    await test.step('Open Lightning Sales App', async () => {
        await page.goto(`${process.env.SFDC_BASE_URL}/lightning/app/standard__LightningSales`);
    });
    await casePage.openNewCaseForm();
    //(await basePage.navigateTo()).lightningSales();
    //(await basePage.navigateTo()).salesforcePage('lightning/o/Contact/list');
    

    await basePage.click(page.getByRole('button',{name: 'New', exact: true}))
    await basePage.setLookupField('Contact Name','Mukesh Sharma');
    await basePage.setLookupField('Account Name','Barton Media');
    await basePage.selectPicklistByLabel('Status','New');
    await basePage.selectPicklistByLabel('Case Origin','Web');
    await basePage.fill(page.getByRole('textbox', {name: 'Subject'}), `Case Subject: ${Utility.getRandomString(10)}`);
    await basePage.fill(page.getByLabel('Description'),`Case Description ${Utility.getRandomString(20)}`);
    await basePage.click(page.locator(`//records-record-layout-item[@field-label='RichTextField']//lightning-input-rich-text//div[@class='slds-rich-text-editor__textarea slds-grid']`));
    await basePage.fill(page.locator(`//records-record-layout-item[@field-label='RichTextField']//lightning-input-rich-text//div[starts-with(@class,'ql-editor')]`),`Rich text ${Utility.getRandomString(30)}`);
    await basePage.click(page.getByRole('button',{name:'Save', exact:true}));

    await test.step('Get and log created Record ID', async () => {
            createdRecordId = await basePage.getRecordId();
            console.log('Created Record ID:', createdRecordId);
        });

})
test.afterAll(async () => {
    await test.step('Deleting record', async () => {
        if (createdRecordId) {          
            await deleteRecord('Case', createdRecordId);
        }
    });
});


