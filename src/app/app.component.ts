import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { getAI, getGenerativeModel } from '@firebase/ai';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { PrimengModule } from 'src/primeng';
import { emailjsConfig } from './configs/emailjs-config';
import { firebaseConfig } from './configs/firebase-config';
import { Badge } from "primeng/badge";
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, Badge],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  db!: firebase.database.Database;
  userDialogVisible = false;
  addDialogVisible = false;
  statusOptions = [
    { label: 'Disponibil', value: 'new' },
    { label: 'Mă ocup eu', value: 'pending' },
    { label: 'Am luat eu', value: 'done' }
  ];
  selectedTab: any = '0';
  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  currentUser = {
    username: '',
    email: '',
    fullname: '',
    groupCode: ''
  };
  groupUsers: any[] = [];
  wishes: any[] = [];
  newItemName = '';
  darkMode: string = 'disabled';

  isSavingUser = false;
  isSavingItem = false;
  isLoadingItems = false;

  constructor(
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.initializeFirebase();
    this.darkMode = localStorage.getItem('darkMode') || 'disabled';
    if (this.darkMode === 'enabled') {
      document.querySelector('html')!.classList.add('app-dark');
    }

    this.currentUser.username = localStorage.getItem('username')!;
    if (this.currentUser.username) {
      this.loadUserFromDatabase();
    } else {
      this.userDialogVisible = true;
    }
  }

  private initializeFirebase() {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this.db = firebase.database();
  }

  loadItems() {
    const itemsRef = this.db.ref('wishes').child(this.currentUser.groupCode);
    itemsRef.once('value').then((snapshot: any) => {
      const items = snapshot.val();
      if (items) {
        this.wishes = Object.keys(items).map(key => ({
          id: key,
          name: items[key].name,
          username: items[key].username,
          statusBy: items[key].statusBy,
          status: items[key].username == this.currentUser.username ? '-' : items[key].status,
          statusByFullname: this.groupUsers.find(u => u.username === items[key].statusBy)?.fullname,
          date: items[key].date,
          statusDate: items[key].statusDate,
          userFullname: this.groupUsers.find(u => u.username === items[key].username)?.fullname
        }));
      } else {
        this.wishes = [];
      }
    }).catch((error: any) => this.showError('Error loading items from Firebase: ', error))
      .finally(() => {
        this.isLoadingItems = false;
      });
  }

  showAddDialog() {
    this.addDialogVisible = true;
    this.newItemName = '';
  }

  updateStatus(item: any, status: any) {
    if (status === 'done') {
      const oldStatus = item.status;
      item.status = null;
      this.confirmationService.confirm({
        header: `Ești sigur că ai luat dorința?`,
        message: 'Odată schimbat statusul nu va mai putea fi modificat.',
        acceptButtonStyleClass: 'p-button-success',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptLabel: 'Da, am luat-o',
        rejectLabel: 'Nu, mă răzgândesc',
        accept: () => {
          this.finalizeStatusUpdate(item, status);
        },
        reject: () => {
          item.status = oldStatus;
          return;
        }
      });
    } else {
      this.finalizeStatusUpdate(item, status);
    }
  }

  private finalizeStatusUpdate(item: any, status: any) {
    item.status = status;
    item.statusBy = this.currentUser.username;
    item.statusDate = new Date().toISOString();
    const itemRef = this.db.ref('wishes').child(this.currentUser.groupCode).child(item.id);
    itemRef.update({
      status: item.status,
      statusBy: this.currentUser.username,
      statusDate: item.statusDate
    }).then(() => {
    }).catch((error: any) => this.showError('Error finalizing item status in Realtime Database: ', error));
  }

  getFilteredItems(tab: string) {
    switch (tab) {
      case '0':
        return this.wishes
          .filter((item: any) => item.username !== this.currentUser.username && item.status !== 'done')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      case '1':
        return this.wishes
          .filter((item: any) => item.username === this.currentUser.username)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      case '2':
        return this.wishes
          .filter((item: any) => item.username !== this.currentUser.username && item.status === 'done')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      default:
        return [];
    }
  }

  saveItem() {
    if (this.newItemName.trim()) {
      const newItem = {
        name: this.newItemName.trim(),
        username: this.currentUser.username,
        status: 'new',
        date: new Date().toISOString()
      };
      this.isSavingItem = true;
      const itemsRef = this.db.ref('wishes').child(this.currentUser.groupCode);
      const newItemRef = itemsRef.push(newItem);
      newItemRef.then(() => {
        const item = { ...newItem, id: newItemRef.key, userFullname: this.currentUser.fullname };
        this.wishes.push(item);
        this.sendMail(item);
        this.addDialogVisible = false;
      }).catch((error: any) => this.showError('Error adding item to Realtime Database: ', error))
        .finally(() => {
          this.isSavingItem = false;
        });
      newItem.status = '-';
      this.selectedTab = '1';
    }
  }

  deleteItem(item: any) {
    const itemRef = this.db.ref('wishes').child(this.currentUser.groupCode).child(item.id);
    itemRef.remove().then(() => {
      this.wishes = this.wishes.filter((i: any) => i.id !== item.id);
    }).catch((error: any) => {
      this.showError('Error deleting item from Firebase: ', error);
    });
  }

  saveUserData() {
    this.isSavingUser = true;
    this.currentUser = {
      email: this.currentUser.email.trim(),
      fullname: this.currentUser.fullname.trim(),
      groupCode: this.currentUser.groupCode.trim().toLowerCase(),
      username: this.currentUser.email.trim().split('@')[0].toLowerCase()
    }
    const ref = this.db.ref('users');
    ref.child(this.currentUser.username).set(this.currentUser).then(() => {
      localStorage.setItem('username', this.currentUser.username);
      this.userDialogVisible = false;
      this.getGroupUsers();
    }).catch((err: any) => this.showError('Error saving user to DB:', err))
      .finally(() => {
        this.isSavingUser = false;
      });
  }

  toggleDarkMode() {
    const element = document.querySelector('html')!;
    element.classList.toggle('app-dark');
    this.darkMode = element.classList.contains('app-dark') ? 'enabled' : 'disabled';
    localStorage.setItem('darkMode', this.darkMode);
  }

  async sendMail(item: any) {
    let emailMessage = await this.getAiMessage(item) || '';

    this.groupUsers.filter((u: any) => u.username !== this.currentUser.username).forEach((user: any) => {
      const templateParams = {
        name: item.userFullname,
        message: emailMessage,
        email: user.email
      };
      emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, templateParams, emailjsConfig.userId)
        .catch((err: any) => this.showError('Failed...', err));
    });
  }

  getGroupUsers() {
    this.groupUsers = [];
    const usersRef = this.db.ref('users').orderByChild('groupCode').equalTo(this.currentUser.groupCode);
    usersRef.once('value').then((snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        Object.keys(data).forEach(key => {
          this.groupUsers.push({
            email: data[key].email,
            fullname: data[key].fullname,
            groupCode: data[key].groupCode,
            username: key
          });
        });
        this.loadItems();
      }
    }).catch((error: any) => this.showError('Error loading group users from Firebase: ', error));
  }

  async getAiMessage(item: any) {
    const model = getGenerativeModel(getAI(), { model: "gemini-2.5-flash" });
    const prompt = `Găsește informații relevante despre: ${item.name}. Dacă este posibil, oferă o estimare de preț în lei și alternative similare sau recomandări. Nu repeta numele cadoului dacă nu este necesar.
      Dacă nu găsești nimic, răspunde cu: "Nu prea s-au găsit informații despre ${item.name}." Fără formatare cu bold și fără întrebări. Fără adresare personală. Maximum 35 de cuvinte.`;
    const result = await model.generateContent(prompt);
    const text = `Lui ${item.userFullname} iar plăcea ${item.name}!\n${result.response.text()}`;
    return text;
  }

  loadUserFromDatabase() {
    this.isLoadingItems = true;
    const userRef = this.db.ref('users').child(this.currentUser.username);
    userRef.once('value').then((snapshot: any) => {
      if (snapshot.val()) {
        this.currentUser = { ...this.currentUser, ...snapshot.val() };
        this.getGroupUsers();
      } else {
        this.isLoadingItems = false;
        this.userDialogVisible = true;
      }
    }).catch((error: any) => this.showError('Error loading user from Firebase: ', error));
  }

  private showError(message: string, error: any) {
    this.confirmationService.confirm({
      header: 'Eroare',
      message: message + (error.message || error),
      acceptLabel: 'OK',
      acceptButtonStyleClass: 'p-button-secondary',
      rejectVisible: false
    });
  }

  disconnectUser() {
    localStorage.removeItem('username');
    location.reload();
  }
}