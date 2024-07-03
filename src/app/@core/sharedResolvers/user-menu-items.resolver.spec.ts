import { TestBed } from '@angular/core/testing';

import { UserMenuItemsResolver } from './user-menu-items.resolver';

describe('UserMenuItemsResolver', () => {
  let resolver: UserMenuItemsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(UserMenuItemsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
