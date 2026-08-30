importScripts(
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAX12tiTOkSoJ6HWrm4r6qXTNedmjRFy7A",
  authDomain: "merakiaca-3a05a.firebaseapp.com",
  projectId: "merakiaca-3a05a",
  storageBucket: "merakiaca-3a05a.firebasestorage.app",
  messagingSenderId: "892600849294",
  appId: "1:892600849294:web:84f33fb4cb41ea62a70adf",
});

firebase.messaging();
