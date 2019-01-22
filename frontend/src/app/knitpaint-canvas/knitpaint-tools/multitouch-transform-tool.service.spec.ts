import { TestBed, inject } from '@angular/core/testing';

import { MultitouchTransformTool } from './multitouch-transform-tool.service';

describe('MultitouchTransformTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultitouchTransformTool]
    });
  });

  it('should be created', inject([MultitouchTransformTool], (service: MultitouchTransformTool) => {
    expect(service).toBeTruthy();
  }));
});
