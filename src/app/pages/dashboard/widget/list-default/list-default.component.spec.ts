import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDefaultComponent } from './list-default.component';

describe('ListDefaultComponent', () => {
  let component: ListDefaultComponent;
  let fixture: ComponentFixture<ListDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListDefaultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
