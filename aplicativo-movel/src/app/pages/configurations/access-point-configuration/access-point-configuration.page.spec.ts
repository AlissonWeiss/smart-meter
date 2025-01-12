import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessPointConfigurationPage } from './access-point-configuration.page';

describe('AccessPointConfigurationPage', () => {
  let component: AccessPointConfigurationPage;
  let fixture: ComponentFixture<AccessPointConfigurationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccessPointConfigurationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
