import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'WishList';
  name: string = '';
  nameDialogVisible: boolean = false;
  items: any = [];
  displayDialog: boolean = false;
  newItemName: string = '';
  db!: firebase.database.Database;
  statusOptions = [
    { label: 'Nou', value: 'New' },
    { label: 'Ocupat', value: 'Pending' },
    { label: 'Luat', value: 'Done' }
  ];
  selectedTab: any = '0';

  ngOnInit() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode == undefined || darkMode === 'enabled') {
      document.querySelector('html')!.classList.add('app-dark');
    }

    if (localStorage.getItem('name')) {
      this.name = localStorage.getItem('name') ?? '';
    } else {
      this.nameDialogVisible = true;
    }
    this.initializeFirebase();
    this.loadItems();
  }

  initializeFirebase() {
    const firebaseConfig = {
      apiKey: "AIzaSyCCnHZNEzSqcL59wbEtg8ABYz9mVja2_us",
      authDomain: "wishlist-e829a.firebaseapp.com",
      databaseURL: "https://wishlist-e829a-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "wishlist-e829a",
      storageBucket: "wishlist-e829a.firebasestorage.app",
      messagingSenderId: "533375747230",
      appId: "1:533375747230:web:fed6fd3d02a7a39e12e78f"
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this.db = firebase.database();
  }

  loadItems() {
    const itemsRef = this.db.ref('items');

    itemsRef.once('value')
      .then((snapshot: any) => {
        const items = snapshot.val();
        if (items) {
          this.items = Object.keys(items).map(key => ({
            id: key,
            name: items[key].name,
            user: items[key].user,
            statusBy: items[key].statusBy,
            status: items[key].user == this.name ? '-' : items[key].status,
          }));
        } else {
          this.items = [];
        }
      })
      .catch((error: any) => {
        console.error('Error loading items from Firebase: ', error);
      });
  }

  showDialog() {
    this.displayDialog = true;
    this.newItemName = '';
  }

  updateStatus(item: any) {
    item.statusBy = this.name;
    const itemRef = this.db.ref('items').child(item.id);
    itemRef.update({
      status: item.status,
      statusBy: this.name
    }).then(() => {
      console.log(`Item ${item.id} status updated to: ${item.status}`);
    }).catch((error: any) => {
      console.error('Error updating item in Realtime Database: ', error);
    });
  }

  getFilteredItems() {
    switch (this.selectedTab) {
      case '0':
        return this.items
          .filter((item: any) => item.user !== this.name && item.status !== 'Done')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      case '1':
        return this.items
          .filter((item: any) => item.user === this.name)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      case '2':
        return this.items
          .filter((item: any) => item.user !== this.name && item.status === 'Done')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
      default:
        return [];
    }
  }

  addItem() {
    if (this.newItemName.trim()) {
      const newItem = {
        name: this.newItemName,
        user: this.name,
        status: 'New',
        date: new Date().toISOString()
      };
      this.saveItem(newItem);
      newItem.status = '-';
      this.selectedTab = '1';
    }
  }

  deleteItem(item: any) {
    const itemRef = this.db.ref('items/' + item.id);
    itemRef.remove().then(() => {
      this.items = this.items.filter((i: any) => i.id !== item.id);
      console.log('Item deleted successfully');
    }).catch((error: any) => {
      console.error('Error deleting item from Firebase: ', error);
    });
  }

  saveItem(item: any) {
    const itemsRef = this.db.ref('items');
    const newItemRef = itemsRef.push(item);
    newItemRef.then(() => {
      item.id = newItemRef.key;
      this.displayDialog = false;
      this.items.push(item);
    }).catch((error: any) => {
      console.error('Error adding item to Realtime Database: ', error);
    });
  }

  onEnterName() {
    localStorage.setItem('name', this.name);
    this.nameDialogVisible = false;
  }

  toggleDarkMode() {
    const element = document.querySelector('html')!;
    element.classList.toggle('app-dark');
    const isDarkMode = element.classList.contains('app-dark');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
  }
}
