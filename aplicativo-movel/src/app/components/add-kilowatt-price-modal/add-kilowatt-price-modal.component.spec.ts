import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddKilowattPriceModalComponent } from './add-kilowatt-price-modal.component';

describe('AddKilowattPriceModalComponent', () => {
  let component: AddKilowattPriceModalComponent;
  let fixture: ComponentFixture<AddKilowattPriceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddKilowattPriceModalComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddKilowattPriceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
