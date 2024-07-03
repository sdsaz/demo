import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitytagcategoryListComponent } from './entitytagcategory-list.component';

describe('EntitytagcategoryListComponent', () => {
  let component: EntitytagcategoryListComponent;
  let fixture: ComponentFixture<EntitytagcategoryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntitytagcategoryListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitytagcategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
