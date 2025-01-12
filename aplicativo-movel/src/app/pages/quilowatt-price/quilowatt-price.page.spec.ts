import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuilowattPricePage } from './quilowatt-price.page';

describe('QuilowattPricePage', () => {
  let component: QuilowattPricePage;
  let fixture: ComponentFixture<QuilowattPricePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuilowattPricePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
