import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseWorkflowListComponent } from './case-workflow-list.component';

describe('CaseWorkflowListComponent', () => {
  let component: CaseWorkflowListComponent;
  let fixture: ComponentFixture<CaseWorkflowListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaseWorkflowListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaseWorkflowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
