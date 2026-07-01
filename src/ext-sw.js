/// <reference lib="webworker" />

importScripts('./ngsw-worker.js');

(function () {
  'use strict';

  self.addEventListener('push', (event) => {
    if (event.data) {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icons/icon192.png',
        badge: '/icons/icon-transparent.png',
      };
      if (data.tag) {
        options.tag = data.tag;
      }
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  });
})();
