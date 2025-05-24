const firebaseConfig = {
  apiKey: "AIzaSyDTfLfb9gnn4zBGju8XoqAe-i7g9ahJyJk",
  authDomain: "sa-job-opportunities.firebaseapp.com",
  projectId: "sa-job-opportunities",
  storageBucket: "sa-job-opportunities.appspot.com",
  messagingSenderId: "370537417491",
  appId: "1:370537417491:web:520e9dc1efb1d8cf38a8e6",
  measurementId: "G-ZTK2KXSLXD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
