import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'smart-meters',
    loadComponent: () => import('./pages/my-smart-meters/my-smart-meters.page').then( m => m.MySmartMetersPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'quilowatt',
    loadComponent: () => import('./pages/quilowatt-price/quilowatt-price.page').then( m => m.QuilowattPricePage)
  },
  {
    path: 'reports/home',
    loadComponent: () => import('./pages/reports/home/reports.page').then( m => m.ReportsPage)
  },
  {
    path: 'real-time-consumption',
    loadComponent: () => import('./pages/real-time-consumption/real-time-consumption.page').then( m => m.RealTimeConsumptionPage)
  },
  {
    path: 'my-configurations',
    loadComponent: () => import('./pages/my-configurations/my-configurations.page').then( m => m.MyConfigurationsPage)
  },
  {
    path: 'report/consumption-report',
    loadComponent: () => import('./pages/reports/consumption-report/consumption-report.page').then( m => m.ConsumptionReportPage)
  },
  {
    path: 'report/lack-of-energy',
    loadComponent: () => import('./pages/reports/lack-of-energy/lack-of-energy.page').then( m => m.LackOfEnergyPage)
  },
  {
    path: 'report/consumption-limits',
    loadComponent: () => import('./pages/reports/consumption-limits/consumption-limits.page').then( m => m.ConsumptionLimitsPage)
  },
  {
    path: 'report/kilowatt-prices',
    loadComponent: () => import('./pages/reports/kilowatt-prices/kilowatt-prices.page').then( m => m.KilowattPricesPage)
  },
  {
    path: 'report/compare-consumption',
    loadComponent: () => import('./pages/reports/compare-consumption/compare-consumption.page').then( m => m.CompareConsumptionPage)
  },
  {
    path: 'report/monthly-cost',
    loadComponent: () => import('./pages/reports/monthly-cost-report/monthly-cost-report.page').then( m => m.MonthlyCostReportPage)
  },
  {
    path: 'configuration/access-point',
    loadComponent: () => import('./pages/configurations/access-point-configuration/access-point-configuration.page').then( m => m.AccessPointConfigurationPage)
  },

];
