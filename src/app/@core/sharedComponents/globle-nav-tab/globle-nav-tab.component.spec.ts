import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobleNavTabComponent } from './globle-nav-tab.component';

describe('GlobleNavTabComponent', () => {
  let component: GlobleNavTabComponent;
  let fixture: ComponentFixture<GlobleNavTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GlobleNavTabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobleNavTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
