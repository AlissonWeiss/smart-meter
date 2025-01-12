import { Component, Injectable, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { IonButton, IonButtons, IonCol, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonRow, IonTitle, IonToast, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCode } from 'ionicons/icons';
import { FiwareAPIService, SmartMeter } from '../../services/fiware-api/fiware-api.service';
import { QrCodeScannerModalComponent } from '../qr-code-scanner-modal/qr-code-scanner-modal.component';

@Injectable({
  providedIn: 'root'
})
@Component({
  selector: 'app-add-smart-meter-modal',
  templateUrl: './add-smart-meter-modal.component.html',
  styleUrls: ['./add-smart-meter-modal.component.scss'],
  providers: [FiwareAPIService, ModalController, ToastController, QrCodeScannerModalComponent, IonModal],
  standalone: true,
  imports: [
    IonContent, FormsModule, IonHeader, IonTitle, IonToolbar,
    IonLabel, IonItem, IonList, IonMenuButton, IonButtons,
    IonButton, IonInput, IonToast, IonCol, IonRow, IonIcon
  ]
})
export class AddSmartMeterModalComponent implements OnChanges {

  @Input() existingSmartMeters: SmartMeter[] = [];
  @Input() isEditMode: boolean = false;
  @Input() smartMeterId: string = '';
  @Input() smartMeterName: string = '';

  enableSaveButton: boolean = false;

  constructor(
    private modalController: ModalController,
    private fiwareAPIService: FiwareAPIService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    addIcons({ 'qr-code': qrCode });
    this.enableSaveButton = this.isEditMode;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditMode']) {
      this.enableSaveButton = changes['isEditMode'].currentValue;
    }
  }

  saveSmartMeter() {
    if (this.isEditMode) {
      this.updateSmartMeter();
    } else {
      this.addSmartMeter();
    }
  }

  private updateSmartMeter() {
    this.fiwareAPIService.updateSmartMeterAttr(this.smartMeterId, 'name', 'Text', this.smartMeterName).subscribe(
      isSuccess => {
        if (isSuccess) {
          this.updateSmartMeterInList();
          this.showToast('Nome do SmartMeter atualizado com sucesso', 'success');
        } else {
          this.showToast('Ocorreu um erro ao atualizar o nome do Smart Meter', 'danger');
        }
        this.dismissModal();
      },
      error => {
        this.showToast('Ocorreu um erro ao atualizar o nome do Smart Meter', 'danger');
      }
    );
  }

  private updateSmartMeterInList() {
    const index = this.existingSmartMeters.findIndex(meter => meter.id === this.smartMeterId);
    if (index !== -1) {
      this.existingSmartMeters[index].name = this.smartMeterName;
    }
  }

  private addSmartMeter() {
    if (this.smartMeterId === '') {
      this.showToast('É necessário preencher o ID do Smart Meter', 'warning');
      return;
    }

    if (this.existingSmartMeters.some(meter => meter.id === this.smartMeterId)) {
      this.showToast('Smart Meter já adicionado à sua lista', 'warning');
      return;
    }

    this.fiwareAPIService.getSmartMeterById(this.smartMeterId).subscribe({
      next: (data: SmartMeter) => {
        if (data) {
          this.existingSmartMeters.push(data);
          this.showToast('Smart meter adicionado com sucesso', 'success');
          this.dismissModal();
        } else {
          this.showToast('Smart meter não encontrado', 'danger');
        }
      },
      error: (error) => {
        if (error.status === 404) {
          this.showToast('Smart meter não encontrado', 'danger');
        } else {
          this.showToast('Servidor indisponível, tente novamente mais tarde', 'danger');
        }
      },
      complete: () => console.log('Smart meters fetched successfully')
    });
  }

  verifySmartMeter() {
    if (this.smartMeterId === '') {
      this.showToast('É necessário preencher o ID do Smart Meter', 'warning');
      return;
    }

    this.fiwareAPIService.getSmartMeterById(this.smartMeterId).subscribe({
      next: (data: SmartMeter) => {
        if (data) {
          this.smartMeterId = data.id;
          this.smartMeterName = data.name;
          this.enableSaveButton = true;
          this.showToast('Smart meter verificado com sucesso', 'success');
        } else {
          this.enableSaveButton = false;
          this.showToast('Smart meter não encontrado', 'danger');
        }
      },
      error: (error) => {
        this.enableSaveButton = false;
        if (error.status === 404) {
          this.showToast('Smart meter não encontrado', 'danger');
        } else {
          this.showToast('Servidor indisponível, tente novamente mais tarde', 'danger');
        }
      },
      complete: () => console.log('Smart meters fetched successfully')
    });
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }

  async openQrReader(): Promise<any> {
    const modal = await this.modalController.create({
      component: QrCodeScannerModalComponent
    });

    modal.onDidDismiss().then((data) => {
      const barcode = data.data?.barcode;
      if (barcode) {
        console.log("🚀 ~ AddSmartMeterModalComponent ~ modal.onDidDismiss ~ barcode.rawValue:", barcode.rawValue);
        this.smartMeterId = barcode.rawValue;
      }
    });

    return await modal.present().then().catch((x) => { alert("Error :" + x); })
  }
}
