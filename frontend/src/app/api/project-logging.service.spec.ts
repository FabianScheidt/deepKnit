import { TestBed } from '@angular/core/testing';

import { ProjectLoggingService } from './project-logging.service';

describe('ProjectLoggingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProjectLoggingService = TestBed.get(ProjectLoggingService);
    expect(service).toBeTruthy();
  });
});
