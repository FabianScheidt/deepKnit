import { TestBed, inject } from '@angular/core/testing';

import { KeyboardTransformTool } from './keyboard-transform-tool.service';

describe('KeyboardTransformTool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyboardTransformTool]
    });
  });

  it('should be created', inject([KeyboardTransformTool], (service: KeyboardTransformTool) => {
    expect(service).toBeTruthy();
  }));
});
