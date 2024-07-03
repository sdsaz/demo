import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { PrivacyPolicyComponent } from './privacy-policy.component';

@NgModule({
    declarations: [
        PrivacyPolicyComponent
    ],
    imports: [
        TranslateModule
    ],
    exports: []
})

export class PrivacyPolicyModule {
}
