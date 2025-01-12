import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsumptionLimitsPage } from './consumption-limits.page';

describe('ConsumptionLimitsPage', () => {
  let component: ConsumptionLimitsPage;
  let fixture: ComponentFixture<ConsumptionLimitsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsumptionLimitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
