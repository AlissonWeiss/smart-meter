import { TestBed } from '@angular/core/testing';

import { FiwareAPIService } from './fiware-api.service';

describe('FiwareAPIService', () => {
  let service: FiwareAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiwareAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
