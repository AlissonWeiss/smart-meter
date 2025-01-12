import { TestBed } from '@angular/core/testing';

import { SqlFileReaderService } from './sql-file-reader.service';

describe('SqlFileReaderService', () => {
  let service: SqlFileReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SqlFileReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
