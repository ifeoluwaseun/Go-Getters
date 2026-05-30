self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Go-Getters";
    const options = {
      body: payload.body || "Get ready to execute your goals today!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: payload.url || "/dashboard",
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Error displaying push notification:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickActionPromise = clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  }).then((windowClients) => {
    const targetUrl = event.notification.data?.url || "/dashboard";
    // Check if there is already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(self.location.origin) && "focus" in client) {
        return client.navigate(targetUrl).then(c => c.focus());
      }
    }
    // If no window is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(clickActionPromise);
});
