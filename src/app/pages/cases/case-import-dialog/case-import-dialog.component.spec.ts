import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseImportDialogComponent } from './case-import-dialog.component';

describe('CaseImportDialogComponent', () => {
  let component: CaseImportDialogComponent;
  let fixture: ComponentFixture<CaseImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaseImportDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaseImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
