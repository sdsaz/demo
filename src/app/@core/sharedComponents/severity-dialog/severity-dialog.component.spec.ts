import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeverityDialogComponent } from './severity-dialog.component';

describe('SeverityDialogComponent', () => {
  let component: SeverityDialogComponent;
  let fixture: ComponentFixture<SeverityDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeverityDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeverityDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
