import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonList, IonButton, IonCol, IonRow, IonSelectOption, IonGrid, IonMenuButton, IonButtons, IonSpinner, IonInput, IonSelect, IonIcon } from '@ionic/angular/standalone';
import { SqlFileReaderService } from 'src/app/services/sql-file-reader/sql-file-reader.service';
import { FiwareAPIService, LackOfEnergy, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-lack-of-energy',
  templateUrl: './lack-of-energy.page.html',
  styleUrls: ['./lack-of-energy.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonLabel, IonItem, IonList, IonButton, IonCol, IonRow, IonSelectOption, IonGrid, IonMenuButton, IonButtons, IonSpinner, IonInput, IonSelect, IonIcon]
})
export class LackOfEnergyPage implements OnInit {

  pageTitle: string = '';
  isLoading: boolean = false;
  showEyeButton: boolean = true;

  initialDate?: Date;
  endDate?: Date;
  minimumPeriod?: number;
  mySmartMeters: { id: string, name: string }[] = [];
  selectedSmartMeters: string[] = [];

  lackOfEnergies: LackOfEnergy[] = [];

  constructor(
    private sqlFileReaderService: SqlFileReaderService,
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.pageTitle = 'Relatório - Falta de energia';
    addIcons({ eyeOffOutline, eyeOutline });
    this.loadMySmartMeters();
  }

  toggleEyeButton() {
    this.showEyeButton = !this.showEyeButton;
  }

  async validateFields(): Promise<boolean> {
    if (!this.initialDate || !this.endDate) {
      await this.showToast('Por favor preencha a data inicial e final', 'warning');
      return false;
    }

    if (this.initialDate >= this.endDate) {
      await this.showToast('A data final deve ser posterior a data inicial', 'warning');
      return false;
    }

    if (!this.minimumPeriod) {
      await this.showToast('É necessário preencher a duração mínima para consideração de falta de energia', 'warning');
      return false;
    }

    if (!this.selectedSmartMeters || this.selectedSmartMeters.length === 0) {
      await this.showToast('Por favor, selecione pelo menos um SmartMeter', 'warning');
      return false;
    }

    return true;
  }

  searchForLackOfEnergy() {
    this.isLoading = true;

    this.validateFields().then(
      (result) => {
        if (!result) {
          this.isLoading = false;
          return;
        }
        else {
          this.sqlFileReaderService.getLackOfEnergyFileContent().subscribe(
            (content) => {
              this.executeAndFillListOfLackOfEnergy(this.formatSqlToExecuteOnFiware(content));
              this.isLoading = false;
            },
            (error) => {
              console.log("LackOfEnergyPage ~ buscarFalhas ~ error:", error);
              this.isLoading = false;
            }
          );
        }
      }
    );
  }

  private executeAndFillListOfLackOfEnergy(body: string) {
    this.fiwareApiService.executeQuantumLeapQuery(body).subscribe(
      {
        next: (data: QuantumLeapSQLEntity) => {
          if (data) {
            this.formatDataToList(data);
            console.log("Successfully recovered QuantumLeap SQL.");
          }
        },
        error: (error) => {
          console.error('Error fetching QuantumLeap SQL', error);
        },
        complete: () => console.log('QuantumLeap SQL fetched successfully')
      }
    );
  }

  private formatSqlToExecuteOnFiware(content: string): any {
    const from_date = this.initialDate;
    const to_date = this.endDate;
    const inFormatted = `(${this.selectedSmartMeters.map(str => `'${str}'`).join(', ')})`
    content = content.replace("$4", inFormatted)
    const contract = {
      stmt: content,
      args: [from_date, to_date, this.minimumPeriod]
    };

    return contract;
  }

  private formatDataToList(data: QuantumLeapSQLEntity) {

    this.lackOfEnergies = [];

    if (data.rows.length === 0) {
      const lackOfEnergy: LackOfEnergy = {
        smart_meter_id: "",
        from_datetime: new Date(),
        to_datetime: new Date(),
        gap_in_seconds: 0
      }

      this.lackOfEnergies.push(lackOfEnergy);

      return;
    }

    data.rows.forEach(item => {

      const from_datetime = new Date(item[1]);
      const gap_as_seconds = item[2];
      const to_datetime = new Date(from_datetime.getTime() + gap_as_seconds * 1000);

      const lackOfEnergy: LackOfEnergy = {
        smart_meter_id: item[0],
        from_datetime: from_datetime,
        to_datetime: to_datetime,
        gap_in_seconds: gap_as_seconds
      }

      this.lackOfEnergies.push(lackOfEnergy);
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

  loadMySmartMeters() {
    var smartMeters = localStorage.getItem('savedSmartMeters');
    if (smartMeters == null) {
      return;
    }

    var jsonSmartMeters = JSON.parse(smartMeters);
    this.mySmartMeters = jsonSmartMeters.map((meter: any) => {
      return {
        id: meter.id,
        name: meter.name
      };
    });
  }
}
