import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySmartMetersPage } from './my-smart-meters.page';

describe('MySmartMetersPage', () => {
  let component: MySmartMetersPage;
  let fixture: ComponentFixture<MySmartMetersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MySmartMetersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
