import { TestBed, inject } from '@angular/core/testing';

import { KnitpaintSamplingService } from './knitpaint-sampling.service';

describe('KnitpaintSamplingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KnitpaintSamplingService]
    });
  });

  it('should be created', inject([KnitpaintSamplingService], (service: KnitpaintSamplingService) => {
    expect(service).toBeTruthy();
  }));
});
