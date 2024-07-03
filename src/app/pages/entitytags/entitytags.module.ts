import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EntitytagListComponent } from './entitytag-list/entitytag-list.component';
import { EntitytagcategoryListComponent } from './entitytagcategory-list/entitytagcategory-list.component';
import { EntitytagAddComponent } from './entitytag-add/entitytag-add.component';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { EntitytagsService } from './entitytags.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { CommonService } from '../../@core/sharedServices/common.service';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TrimValueModule } from '../../@core/sharedDirective/trim-value/trim-value.module';
import { AuthGuard } from '../auth/auth.guard';
import { enumPermissions } from '../../@core/common-helper';

const routes: Routes = [
  {
    path: 'tagcategories',
    component: EntitytagcategoryListComponent,
    data: { permission: enumPermissions.ListTagCategories }
  },
  {
    path: 'tags',
    component: EntitytagListComponent,
    data: { permission: enumPermissions.ListTags }
  },
  {
    path: 'tags/add',
    component: EntitytagAddComponent,
    data: { permission: enumPermissions.AddTag }
  },
  {
    path: 'tags/details/:id',
    component: EntitytagAddComponent,
    data: { permission: enumPermissions.ViewTag }
  }
];

@NgModule({
  declarations: [
    EntitytagListComponent,
    EntitytagcategoryListComponent,
    EntitytagAddComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DropdownModule,
    TableModule,
    TranslateModule,
    ConfirmationDialogModule,
    ActivePipeModule,
    ButtonModule,
    ToggleButtonModule,
    TrimValueModule
  ],
  providers: [
    EntitytagsService,
    CommonService
  ]
})
export class EntitytagsModule { }
