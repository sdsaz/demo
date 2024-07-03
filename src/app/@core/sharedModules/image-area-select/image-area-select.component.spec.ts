import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImageAreaSelectComponent } from './image-area-select.component';

describe('UserImageSelectComponent', () => {
  let component: ImageAreaSelectComponent;
  let fixture: ComponentFixture<ImageAreaSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageAreaSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageAreaSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
