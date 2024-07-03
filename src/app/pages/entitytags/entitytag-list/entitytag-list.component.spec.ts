import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitytagListComponent } from './entitytag-list.component';

describe('EntitytagListComponent', () => {
  let component: EntitytagListComponent;
  let fixture: ComponentFixture<EntitytagListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntitytagListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitytagListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
