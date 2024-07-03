import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DueDateDialogComponent } from './due-date-dialog.component';

describe('DueDateDialogComponent', () => {
  let component: DueDateDialogComponent;
  let fixture: ComponentFixture<DueDateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DueDateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DueDateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
