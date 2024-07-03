import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEntityRelationComponent } from './add-entity-relation.component';

describe('AddEntityRelationComponent', () => {
  let component: AddEntityRelationComponent;
  let fixture: ComponentFixture<AddEntityRelationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEntityRelationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEntityRelationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
