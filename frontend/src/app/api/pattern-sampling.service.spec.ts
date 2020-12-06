import { TestBed } from '@angular/core/testing';

import { PatternSamplingService } from './pattern-sampling.service';

describe('PatternSamplingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PatternSamplingService = TestBed.get(PatternSamplingService);
    expect(service).toBeTruthy();
  });
});
