import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthlyCostReportPage } from './monthly-cost-report.page';

describe('MonthlyCostReportPage', () => {
  let component: MonthlyCostReportPage;
  let fixture: ComponentFixture<MonthlyCostReportPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyCostReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
