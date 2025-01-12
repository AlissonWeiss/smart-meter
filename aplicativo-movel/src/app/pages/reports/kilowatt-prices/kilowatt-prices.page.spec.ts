import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KilowattPricesPage } from './kilowatt-prices.page';

describe('KilowattPricesPage', () => {
  let component: KilowattPricesPage;
  let fixture: ComponentFixture<KilowattPricesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KilowattPricesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
