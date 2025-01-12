import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Network } from '@capacitor/network';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonLabel, IonItem, IonToast, IonInput, IonLoading, IonList, IonCardContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonText, IonInputPasswordToggle, IonButtons, IonMenuButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-access-point-configuration',
  templateUrl: './access-point-configuration.page.html',
  styleUrls: ['./access-point-configuration.page.scss'],
  providers: [HttpClient, ToastController, LoadingController],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonLabel, IonItem, IonToast, IonInput, IonLoading, IonList, IonCardContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonText, IonInputPasswordToggle, IonButtons, IonMenuButton]
})
export class AccessPointConfigurationPage implements OnInit {

  pageTitle = '';
  wifiData = { ssid: '', password: '' };
  esp32IP = '192.168.4.1'; // IP do ESP32 no modo AP
  isNotConnected = true;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController) { }

  ngOnInit(): void {
    this.pageTitle = 'Ponto de Acesso';
    this.checkWiFiConnection();
  }

  async checkWiFiConnection() {
    try {
      const status = await Network.getStatus();
      if (status.connected && status.connectionType === 'wifi') {
        this.isNotConnected = false; // Está conectado à rede Wi-Fi
      } else {
        this.isNotConnected = true; // Não está conectado à rede Wi-Fi
      }
    } catch (error) {
      console.error('Erro ao verificar a rede', error);
      this.isNotConnected = true;
    }
  }

  sendWiFiData() {
    const url = `http://${this.esp32IP}/test-wifi`; // Endpoint para teste
    const body = { ssid: this.wifiData.ssid, password: this.wifiData.password };

    // Exibe spinner e mensagem de tentativa de conexão
    this.showLoadingSpinner('Tentando conectar ao Wi-Fi...');

    console.log("🚀 ~ AccessPointConfigurationPage ~ sendWiFiData ~ url:", url);
    console.log("🚀 ~ AccessPointConfigurationPage ~ sendWiFiData ~ body:", body);

    this.http.post(url, body, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.hideLoadingSpinner(); // Remove o spinner
          if (response.includes('Conexão bem-sucedida')) {
            this.showToast('Conexão realizada com sucesso! Credenciais salvas.', 'success');
          } else {
            this.showToast(response, 'danger'); // Feedback direto do ESP32
          }
        },
        error: (err) => {
          this.hideLoadingSpinner(); // Remove o spinner
          console.error("Erro na solicitação:", err);
          this.showToast('Erro ao enviar os dados. Verifique a conexão e tente novamente.', 'danger');
        },
      });
  }

  async showLoadingSpinner(message: string) {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent',
      duration: 10000, // Tempo limite para evitar travamento (10s)
    });
    await loading.present();
  }

  async hideLoadingSpinner() {
    await this.loadingController.dismiss();
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
