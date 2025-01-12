import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyConfigurationsPage } from './my-configurations.page';

describe('MyConfigurationsPage', () => {
  let component: MyConfigurationsPage;
  let fixture: ComponentFixture<MyConfigurationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyConfigurationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
