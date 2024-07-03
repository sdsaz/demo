import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactImportDialogComponent } from './contact-import-dialog.component';

describe('ContactImportDialogComponent', () => {
  let component: ContactImportDialogComponent;
  let fixture: ComponentFixture<ContactImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContactImportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
