import { TestBed, inject } from '@angular/core/testing';

import { MouseTransformTool } from './mouse-transform-tool.service';

describe('MouseTransformTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MouseTransformTool]
    });
  });

  it('should be created', inject([MouseTransformTool], (service: MouseTransformTool) => {
    expect(service).toBeTruthy();
  }));
});
