/// <reference lib="webworker" />

importScripts('./ngsw-worker.js');

(function () {
  'use strict';

  self.addEventListener('push', (event) => {
    if (event.data) {
      const data = event.data.json();
      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          tag: data.tag,
          icon: '/icons/icon192.png',
          badge: '/icons/icon-transparent.png',
        })
      );
    }
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  });
})();
