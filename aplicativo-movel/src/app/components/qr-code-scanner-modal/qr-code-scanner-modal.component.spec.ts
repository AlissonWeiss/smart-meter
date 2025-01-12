import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QrCodeScannerModalComponent } from './qr-code-scanner-modal.component';

describe('QrCodeScannerModalComponent', () => {
  let component: QrCodeScannerModalComponent;
  let fixture: ComponentFixture<QrCodeScannerModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QrCodeScannerModalComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeScannerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
