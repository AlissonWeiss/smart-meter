import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButtons, IonContent, IonFab, IonFabButton, IonFabList, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonMenuButton, IonModal, IonTitle, IonToast, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, create } from 'ionicons/icons';
import { AddSmartMeterModalComponent } from '../../components/add-smart-meter-modal/add-smart-meter-modal.component';
import { SmartMeter } from '../../services/fiware-api/fiware-api.service';

@Component({
  selector: 'app-my-smart-meters',
  templateUrl: './my-smart-meters.page.html',
  styleUrls: ['./my-smart-meters.page.scss'],
  standalone: true,
  providers: [ModalController, AddSmartMeterModalComponent, IonModal, IonToast],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonFabButton, IonFab, IonLabel, IonItem, IonList, IonMenuButton, IonButtons, IonItemSliding, IonItemOptions, IonItemOption, IonFabList]
})
export class MySmartMetersPage {

  smartMeters: SmartMeter[] = [];
  smartMeterId: string = '';
  pageTitle: string = '';

  constructor(private modalController: ModalController) {
    addIcons({ add, trash, create });
  }

  ngOnInit() {
    this.pageTitle = 'Smart Meters';
    this.loadMySmartMeters();
  }

  async addNewSmartMeter(): Promise<any> {
    const modal = await this.modalController.create({
      component: AddSmartMeterModalComponent,
      componentProps: { existingSmartMeters: this.smartMeters, isEditMode: false, smartMeterId: '', smartMeterName: '' },
    });

    modal.onDidDismiss().then(() => {
      this.updateLocalStorage();
    });

    return await modal.present().then().catch((x) => { alert("Error :" + x); })
  }

  updateLocalStorage() {
    localStorage.setItem('savedSmartMeters', JSON.stringify(this.smartMeters));
  }

  loadMySmartMeters() {
    var smartMeters = localStorage.getItem('savedSmartMeters');
    if (smartMeters == null) {
      return;
    }

    this.smartMeters = JSON.parse(smartMeters);
  }

  async editSmartMeter(id: string, name: string): Promise<any> {
    const modal = await this.modalController.create({
      component: AddSmartMeterModalComponent,
      componentProps: { existingSmartMeters: this.smartMeters, isEditMode: true, smartMeterId: id, smartMeterName: name },
    });

    modal.onDidDismiss().then(() => {
      this.updateLocalStorage();
    });

    return await modal.present().then().catch((x) => { alert("Error :" + x); })
  }

  removeSmartMeter(id: string): void {
    console.log('Removing smart meter with id:', id);
    var smartMeterToRemove = this.smartMeters.filter(sm => sm.id == id)[0]
    var index = this.smartMeters.indexOf(smartMeterToRemove);
    if (index !== -1) {
      this.smartMeters.splice(index, 1);
    }
    this.updateLocalStorage();
  }

}
