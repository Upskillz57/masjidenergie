// Service worker de l'espace admin Masjid Energie : affiche les notifications push
// et ouvre la bonne page quand on touche la notification.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Masjid Energie", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Masjid Energie", {
      body: data.body || "",
      icon: "/brand/icones/masjid-energie-icone-192px.png",
      badge: "/brand/icones/masjid-energie-icone-192px.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/admin/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin/notifications", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Une fenêtre de l'admin est déjà ouverte : on la réutilise.
      const existing = windows.find((w) => new URL(w.url).pathname.startsWith("/admin"));
      if (existing) {
        await existing.focus();
        return existing.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});
