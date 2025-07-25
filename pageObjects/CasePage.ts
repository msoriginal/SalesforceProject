import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CasePage extends BasePage{
    constructor(page: Page){
        super(page);
    }
    

    async openCaseTab(){
        this.page.goto(`${process.env.SFDC_BASE_URL}/lightning/o/Case/list`);
    }

    async openNewCaseForm(){
        await this.openCaseTab();
        await this.page.getByRole('button',{name: 'New', exact: true}).click();
    }




}