import { MaskSsnPipe } from './mask-ssn.pipe';

describe('MaskSsnPipe', () => {
  it('create an instance', () => {
    const pipe = new MaskSsnPipe();
    expect(pipe).toBeTruthy();
  });
});
