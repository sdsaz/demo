import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

//Components
import { UserAssignDialogComponent } from './user-assign-dialog/user-assign-dialog.component';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';

@NgModule({
    declarations: [UserAssignDialogComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        DropdownModule,
        NgbModule,
        ConfiguredEntityNamePipeModule
    ],
    exports: [UserAssignDialogComponent]
})
export class UserAssignModule { }
