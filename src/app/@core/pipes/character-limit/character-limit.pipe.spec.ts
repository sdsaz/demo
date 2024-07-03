import { CharacterLimitPipe } from './character-limit.pipe';

describe('CharacterLimitPipe', () => {
  it('create an instance', () => {
    const pipe = new CharacterLimitPipe();
    expect(pipe).toBeTruthy();
  });
});
