import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { IonButton, IonButtons, IonCheckbox, IonCol, IonContent, IonDatetime, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonRow, IonTitle, IonToolbar, IonModal, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { AddKilowattPriceModalComponent } from 'src/app/components/add-kilowatt-price-modal/add-kilowatt-price-modal.component';
import { FiwareAPIService, QuantumLeapAPIEntity } from 'src/app/services/fiware-api/fiware-api.service';

@Component({
  selector: 'app-quilowatt-price',
  templateUrl: './quilowatt-price.page.html',
  styleUrls: ['./quilowatt-price.page.scss'],
  standalone: true,
  providers: [
    ModalController, AddKilowattPriceModalComponent, ToastController,
    FiwareAPIService, IonModal, IonToast
  ],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonGrid, IonRow, IonCol, IonLabel, IonMenuButton, IonDatetime, IonInput,
    IonCheckbox, IonButtons, IonButton, IonItem, IonFab, IonFabButton, IonIcon
  ]
})
export class QuilowattPricePage implements OnInit {

  pageTitle: string = 'Acompanhamento de preços';
  prices: any[] = [];

  constructor(
    private modalController: ModalController,
    private fiwareAPIService: FiwareAPIService,
    private toastController: ToastController
  ) {
    addIcons({ add });
  }

  async ionViewWillEnter() {
    this.fetchPrices();
  }

  ngOnInit() { }

  private fetchPrices() {
    this.fiwareAPIService.getAllPrices().subscribe({
      next: (data: QuantumLeapAPIEntity) => {
        if (data) {
          console.log("Successfully recovered Kilowatt Prices.");
          this.prices = this.getFormattedPrices(data);
        }
      },
      error: (error) => {
        console.error('Error fetching prices', error);
        this.showToast('Servidor indisponível, tente novamente mais tarde', 'danger');
      },
      complete: () => console.log('Kilowatt prices fetched successfully')
    });
  }

  private getFormattedPrices(data: QuantumLeapAPIEntity): any[] {
    const prices = data.attributes.find(attr => attr.attrName === 'price')?.values || [];
    const startDates = data.attributes.find(attr => attr.attrName === 'startDate')?.values || [];
    const indexDates = data.index || [];
    let formattedPrices = [];

    const minLength = Math.min(prices.length, startDates.length, indexDates.length);

    for (let i = 0; i < minLength; i++) {
      formattedPrices.push({
        kwPrice: prices[i],
        startDate: startDates[i].split('T')[0],
        insertedAt: indexDates[i]
      });
    }

    return formattedPrices;
  }

  async addNewUpdatedPrice() {
    const modal = await this.modalController.create({
      component: AddKilowattPriceModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.fetchPrices();
      }
    });

    await modal.present().catch((error) => {
      console.error("Error presenting modal", error);
      this.showToast('Erro ao abrir o modal', 'danger');
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}
