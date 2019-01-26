import { TestBed } from '@angular/core/testing';

import { TextureTool } from './texture-tool.service';

describe('TextureTool', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TextureTool = TestBed.get(TextureTool);
    expect(service).toBeTruthy();
  });
});
