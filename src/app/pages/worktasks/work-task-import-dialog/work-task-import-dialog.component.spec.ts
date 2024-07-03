import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkTaskImportDialogComponent } from './work-task-import-dialog.component';

describe('WorkTaskImportDialogComponent', () => {
  let component: WorkTaskImportDialogComponent;
  let fixture: ComponentFixture<WorkTaskImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkTaskImportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkTaskImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
