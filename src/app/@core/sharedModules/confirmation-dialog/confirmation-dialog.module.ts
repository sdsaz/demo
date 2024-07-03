import { NgModule } from '@angular/core';

import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogService } from './confirmation-dialog.service';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [
        ConfirmationDialogComponent
    ],
    imports: [
        CommonModule,
        TranslateModule,
        ConfiguredEntityNamePipeModule
    ],
    exports: [],
    providers: [ConfirmationDialogService]
})
export class ConfirmationDialogModule {
}
