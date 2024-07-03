import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadCustomFieldComponent } from './file-upload-custom-field.component';

describe('FileUploadCustomFieldComponent', () => {
  let component: FileUploadCustomFieldComponent;
  let fixture: ComponentFixture<FileUploadCustomFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileUploadCustomFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileUploadCustomFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
