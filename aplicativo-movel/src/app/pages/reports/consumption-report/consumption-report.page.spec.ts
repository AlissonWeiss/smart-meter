import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsumptionReportPage } from './consumption-report.page';

describe('ConsumptionReportPage', () => {
  let component: ConsumptionReportPage;
  let fixture: ComponentFixture<ConsumptionReportPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsumptionReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
