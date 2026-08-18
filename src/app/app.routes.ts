import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CounterComponent } from './pages/counter/counter.component';

export const routes: Routes = [

  {
    path: '',
    component: HomeComponent
  },

  {
    path: 'counter',
    component: CounterComponent
  },

  {
    path: '**',
    redirectTo: ''
  }

];