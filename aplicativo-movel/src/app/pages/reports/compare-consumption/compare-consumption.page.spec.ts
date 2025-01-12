import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompareConsumptionPage } from './compare-consumption.page';

describe('CompareConsumptionPage', () => {
  let component: CompareConsumptionPage;
  let fixture: ComponentFixture<CompareConsumptionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareConsumptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
