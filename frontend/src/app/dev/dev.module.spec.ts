import { DevModule } from './dev.module';

describe('DevModule', () => {
  let devModule: DevModule;

  beforeEach(() => {
    devModule = new DevModule();
  });

  it('should create an instance', () => {
    expect(devModule).toBeTruthy();
  });
});
