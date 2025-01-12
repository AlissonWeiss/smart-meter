import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner, ScanResult } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';

import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flashlight, close } from 'ionicons/icons';

@Component({
  selector: 'app-qr-code-scanner-modal',
  templateUrl: './qr-code-scanner-modal.component.html',
  styleUrls: ['./qr-code-scanner-modal.component.scss'],
  providers: [ModalController, IonModal],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonButton, IonIcon, IonFab, IonFabButton
  ]
})
export class QrCodeScannerModalComponent implements OnInit {

  constructor(
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {

    BarcodeScanner.isGoogleBarcodeScannerModuleAvailable().then(
      (result) => {
        if (!result.available) {
          console.log("🚀 ~ QrCodeScannerModalComponent ~ ngOnInit ~ isGoogleBarcodeScannerModuleAvaiable: ", result.available);
          console.log("Installing Google Barcode Scanner Module.");
          BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      }
    )

    addIcons({ 'close': close, flashlight });

    this.scan();
  }

  async scan(): Promise<void> {

    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }

    await BarcodeScanner.scan().then((result: ScanResult) => {
      if (result) {
        this.closeModal(result.barcodes[0]);
      }
      else {
        this.closeModal();
      }
    }).catch((result) => {
      console.log("🚀 ~ QrCodeScannerModalComponent ~ awaitBarcodeScanner.scan ~ CATCH result:", result);
      this.closeModal();
    });
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permissão negada',
      message: 'Por favor forneça permissão de acesso à camera para usar o QR Code Scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  public async closeModal(barcode?: Barcode): Promise<void> {
    console.log("🚀 ~ QrCodeScannerModalComponent ~ closeModal ~ barcode:", barcode?.rawValue);

    await this.modalController.dismiss({
      barcode: barcode,
    });
  }

}