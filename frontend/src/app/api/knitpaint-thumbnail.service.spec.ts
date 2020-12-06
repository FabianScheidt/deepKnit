import { TestBed } from '@angular/core/testing';

import { KnitpaintThumbnailService } from './knitpaint-thumbnail.service';

describe('KnitpaintThumbnailService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KnitpaintThumbnailService = TestBed.get(KnitpaintThumbnailService);
    expect(service).toBeTruthy();
  });
});
