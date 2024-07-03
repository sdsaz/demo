import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormbuilderComponent } from './formbuilder/formbuilder.component';
import { FormrendererComponent } from './formrenderer/formrenderer.component';
import { RouterModule, Routes } from '@angular/router';
import { FormioModule } from '@formio/angular';
import { DynamicformService } from './dynamicform.service';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: FormbuilderComponent
  },
  {
    path: 'formbuilder',
    component: FormbuilderComponent
  },
  {
    path: 'formrenderer/:guid',
    component: FormrendererComponent
  }
];

@NgModule({
  declarations: [
    FormbuilderComponent,
    FormrendererComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    FormioModule
  ],
  providers: [
    DynamicformService
  ]
})
export class DynamicformModule { }
