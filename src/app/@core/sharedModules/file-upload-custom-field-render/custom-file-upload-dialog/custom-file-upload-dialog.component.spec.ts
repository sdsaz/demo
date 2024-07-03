import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFileUploadDialogComponent } from './custom-file-upload-dialog.component';

describe('CustomFileUploadDialogComponent', () => {
  let component: CustomFileUploadDialogComponent;
  let fixture: ComponentFixture<CustomFileUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomFileUploadDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFileUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
