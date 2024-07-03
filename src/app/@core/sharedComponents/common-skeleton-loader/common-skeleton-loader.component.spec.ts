import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSkeletonLoaderComponent } from './common-skeleton-loader.component';

describe('CommonSkeletonLoaderComponent', () => {
  let component: CommonSkeletonLoaderComponent;
  let fixture: ComponentFixture<CommonSkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonSkeletonLoaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonSkeletonLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
