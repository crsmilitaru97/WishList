import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import Lara from '@primeng/themes/lara';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { providePrimeNG } from 'primeng/config';
import { DialogModule } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FloatLabel,
    DialogModule,
    TableModule,
    CardModule,
    SelectModule
  ],
  providers: [ providePrimeNG({ theme: { preset: Lara } }) ],
  bootstrap: [AppComponent]
})
export class AppModule { }
