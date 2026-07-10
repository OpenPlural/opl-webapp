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
        data: {
          kind: data.kind,
        },
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
    let url = null;
    if (event.notification.data) {
      const kind = event.notification.data.kind;
      if (kind.indexOf('/') === -1) {
        switch (kind) {
          case 'current-front':
            url = '/app/fronters';
            break;
        }
      } else {
        const parts = kind.split('/');
        switch (parts[0]) {
          case 'front':
            url = '/app/friend/' + parts[1];
            break;
        }
      }
    }
    event.notification.close();

    if (url) {
      event.waitUntil(
        clients
          .matchAll({type: "window"})
          .then((clientList) => {
            for (const client of clientList) {
              if (client.url === "/" && "focus" in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
          }),
      );
    }
  });
})();
