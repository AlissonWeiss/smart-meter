import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonTitle, IonToolbar, IonToast } from '@ionic/angular/standalone';
import { FiwareAPIService } from '../../services/fiware-api/fiware-api.service';

@Component({
  selector: 'app-add-kilowatt-price-modal',
  templateUrl: './add-kilowatt-price-modal.component.html',
  styleUrls: ['./add-kilowatt-price-modal.component.scss'],
  providers: [FiwareAPIService, ModalController, ToastController],
  standalone: true,
  imports: [
    IonButton, FormsModule, IonButtons, IonContent, IonHeader, IonInput,
    IonItem, IonLabel, IonList, IonMenuButton, IonTitle, IonToast, IonToolbar
  ]
})
export class AddKilowattPriceModalComponent implements OnInit {

  kilowattUpdatedPrice?: number;
  kilowattEfectiveDate?: Date;

  @Output() priceAdded = new EventEmitter<{ price: number, effectiveDate: Date }>();

  constructor(
    private modalCtrl: ModalController,
    private fiwareAPIService: FiwareAPIService,
    private toastController: ToastController
  ) { }

  ngOnInit() { }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }

  addPrice() {
    if (!this.kilowattUpdatedPrice || this.kilowattUpdatedPrice <= 0) {
      this.showToast('O valor do quilowatt deve ser superior a zero', 'warning');
      return;
    }

    if (!this.kilowattEfectiveDate) {
      this.showToast('A data de efetivação do quilowatt deve ser preenchida', 'warning');
      return;
    }

    this.fiwareAPIService.saveNewKilowattPrice(this.kilowattUpdatedPrice, this.kilowattEfectiveDate).subscribe({
      next: () => {
        this.showToast('Preço do quilowatt salvo com sucesso', 'success');
        this.priceAdded.emit({ price: this.kilowattUpdatedPrice!, effectiveDate: this.kilowattEfectiveDate! });
        this.dismissModal();
      },
      error: () => {
        this.showToast('Ocorreu um erro ao salvar novo preço', 'danger');
      }
    });
  }
}
