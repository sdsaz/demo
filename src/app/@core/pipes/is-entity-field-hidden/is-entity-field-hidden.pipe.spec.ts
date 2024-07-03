import { IsEntityFieldHiddenPipe } from './is-entity-field-hidden.pipe';

describe('IsEntityFieldHiddenPipe', () => {
  it('create an instance', () => {
    const pipe = new IsEntityFieldHiddenPipe();
    expect(pipe).toBeTruthy();
  });
});
