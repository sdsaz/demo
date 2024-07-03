import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterDetailComponent } from './newsletter-detail.component';

describe('NewsletterDetailComponent', () => {
  let component: NewsletterDetailComponent;
  let fixture: ComponentFixture<NewsletterDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewsletterDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsletterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
