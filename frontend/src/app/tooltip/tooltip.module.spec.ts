import { TooltipModule } from './tooltip.module';

describe('TooltipModule', () => {
  let tooltipModule: TooltipModule;

  beforeEach(() => {
    tooltipModule = new TooltipModule();
  });

  it('should create an instance', () => {
    expect(tooltipModule).toBeTruthy();
  });
});
