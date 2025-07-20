import { createAccount } from "../../utils/createAccount";
import { test } from '@playwright/test'

test('Creating Account via API', async () => {
    const accName='TestAccountName';

    const id = await createAccount(accName);

    console.log(id);
    
});