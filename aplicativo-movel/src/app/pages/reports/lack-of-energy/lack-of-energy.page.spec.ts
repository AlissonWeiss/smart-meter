import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LackOfEnergyPage } from './lack-of-energy.page';

describe('LackOfEnergyPage', () => {
  let component: LackOfEnergyPage;
  let fixture: ComponentFixture<LackOfEnergyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LackOfEnergyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
