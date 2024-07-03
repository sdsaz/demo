import { TimeFrameToMinutesPipe } from './time-frame-to-minutes.pipe';

describe('TimeFrameToMinutesPipe', () => {
  it('create an instance', () => {
    const pipe = new TimeFrameToMinutesPipe();
    expect(pipe).toBeTruthy();
  });
});
