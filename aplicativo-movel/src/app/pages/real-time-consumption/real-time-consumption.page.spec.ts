import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RealTimeConsumptionPage } from './real-time-consumption.page';

describe('RealTimeConsumptionPage', () => {
  let component: RealTimeConsumptionPage;
  let fixture: ComponentFixture<RealTimeConsumptionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RealTimeConsumptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
