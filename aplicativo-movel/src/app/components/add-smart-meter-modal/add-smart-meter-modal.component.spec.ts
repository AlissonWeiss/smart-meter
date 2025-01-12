import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddSmartMeterModalComponent } from './add-smart-meter-modal.component';

describe('AddSmartMeterModalComponent', () => {
  let component: AddSmartMeterModalComponent;
  let fixture: ComponentFixture<AddSmartMeterModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddSmartMeterModalComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddSmartMeterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
