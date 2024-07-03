import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EntityStagesDialogComponent } from './entity-stages-dialog/entity-stages-dialog.component';
import { TrimModule } from '../../sharedDirective/trim/trim.module';


@NgModule({
    declarations: [
        EntityStagesDialogComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        DropdownModule,
        NgbModule,
        TrimModule
    ],
    exports: [EntityStagesDialogComponent]
})
export class EntityStagesModule { }
