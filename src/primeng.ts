import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

@NgModule({
  imports: [
    ButtonModule,
    DialogModule,
    DataViewModule,
    InputTextModule,
    SelectModule,
    CardModule,
    TabsModule,
    FloatLabelModule,
    ProgressSpinnerModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
    PopoverModule
  ],
  exports: [
    ButtonModule,
    DialogModule,
    DataViewModule,
    InputTextModule,
    SelectModule,
    CardModule,
    TabsModule,
    FloatLabelModule,
    ProgressSpinnerModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
    PopoverModule
  ]
})
export class PrimengModule { }