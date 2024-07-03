import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitytagAddComponent } from './entitytag-add.component';

describe('EntitytagAddComponent', () => {
  let component: EntitytagAddComponent;
  let fixture: ComponentFixture<EntitytagAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntitytagAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitytagAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
