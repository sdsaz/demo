import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityImportDialogComponent } from './opportunity-import-dialog.component';

describe('OpportunityImportDialogComponent', () => {
  let component: OpportunityImportDialogComponent;
  let fixture: ComponentFixture<OpportunityImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpportunityImportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunityImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
