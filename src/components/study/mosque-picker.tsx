"use client";

import { useState } from "react";

type Point = [lat: number, lon: number];
type Mosque = { id: string; name: string; address: string; km: number };

const RADIUS_M = 15000;

function distanceKm(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Mosquées référencées dans OpenStreetMap autour d'un point (API Overpass, sans clé).
async function findMosques(center: Point): Promise<Mosque[]> {
  const query = `[out:json][timeout:20];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${RADIUS_M},${center[0]},${center[1]});out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error("overpass");
  const json: {
    elements: {
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  } = await res.json();

  return json.elements
    .map((el) => {
      const t = el.tags ?? {};
      const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
      const city = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
      return {
        id: `${el.type}/${el.id}`,
        name: t.name ?? "Mosquée (nom non renseigné)",
        address: [street, city].filter(Boolean).join(", "),
        km: distanceKm(center, [el.lat ?? el.center?.lat ?? center[0], el.lon ?? el.center?.lon ?? center[1]]),
      };
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 40);
}

async function geocode(q: string): Promise<Point> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&limit=1&q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) throw new Error("La recherche a échoué. Réessayez ou indiquez votre mosquée manuellement.");
  const [hit]: { lat: string; lon: string }[] = await res.json();
  if (!hit) throw new Error("Ville ou code postal introuvable.");
  return [Number(hit.lat), Number(hit.lon)];
}

function myPosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Géolocalisation indisponible. Saisissez une ville."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve([p.coords.latitude, p.coords.longitude]),
      () => reject(new Error("Position refusée ou introuvable. Saisissez une ville ou un code postal.")),
      { timeout: 10000 },
    );
  });
}

export const fieldClass =
  "h-11 w-full rounded-lg border border-line bg-bg px-3.5 text-[15px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";

export function MosquePicker({ error }: { error?: string }) {
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [mosques, setMosques] = useState<Mosque[] | null>(null);
  const [selected, setSelected] = useState<Mosque | null>(null);
  const [manual, setManual] = useState(false);

  async function search(locate: () => Promise<Point>) {
    setLoading(true);
    setNote("");
    setSelected(null);
    setMosques(null);
    try {
      const list = await findMosques(await locate());
      setMosques(list);
      if (!list.length) setNote("Aucune mosquée trouvée à moins de 15 km. Indiquez-la manuellement.");
    } catch (e) {
      setNote(
        e instanceof Error && e.message.length > 12
          ? e.message
          : "La recherche a échoué. Réessayez ou indiquez votre mosquée manuellement.",
      );
    } finally {
      setLoading(false);
    }
  }

  const searchPlace = () => place.trim() && search(() => geocode(place.trim()));

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-[15px] font-bold text-heading">Votre mosquée</legend>

      {manual ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="mosqueName" placeholder="Nom de la mosquée" aria-label="Nom de la mosquée" className={fieldClass} />
          <input name="mosqueAddress" placeholder="Adresse ou ville" aria-label="Adresse ou ville" className={fieldClass} />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => search(myPosition)}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Autour de moi
            </button>
            <div className="flex min-w-[220px] flex-1 gap-2">
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchPlace();
                  }
                }}
                placeholder="Ville ou code postal"
                aria-label="Ville ou code postal"
                className={fieldClass}
              />
              <button
                type="button"
                disabled={!place.trim()}
                onClick={searchPlace}
                className="h-11 flex-none cursor-pointer rounded-lg border border-brand/30 px-4 text-sm font-semibold text-brand-text hover:bg-brand/5 disabled:cursor-default disabled:opacity-50"
              >
                Rechercher
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-muted">Recherche des mosquées…</p>}
          {note && <p className="text-sm text-muted">{note}</p>}

          {mosques && mosques.length > 0 && (
            <ul
              aria-label="Mosquées à proximité"
              className="grid max-h-[240px] gap-1 overflow-y-auto rounded-lg border border-line p-1.5"
            >
              {mosques.map((m) => {
                const on = selected?.id === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected(m)}
                      className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left ${
                        on ? "bg-brand text-white" : "text-fg hover:bg-bg-soft"
                      }`}
                    >
                      <span className="grid">
                        <span className="text-[14.5px] font-semibold">{m.name}</span>
                        {m.address && (
                          <span className={`text-[13px] ${on ? "text-on-brand" : "text-muted"}`}>{m.address}</span>
                        )}
                      </span>
                      <span className={`flex-none text-[13px] ${on ? "text-on-brand" : "text-muted"}`}>
                        {m.km < 1 ? `${Math.round(m.km * 1000)} m` : `${m.km.toFixed(1).replace(".", ",")} km`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selected && (
            <>
              <input type="hidden" name="mosqueName" value={selected.name} />
              <input type="hidden" name="mosqueAddress" value={selected.address} />
              <input type="hidden" name="mosqueOsm" value={selected.id} />
            </>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setManual((m) => !m)}
        className="cursor-pointer justify-self-start text-sm font-medium text-brand-text underline underline-offset-2"
      >
        {manual ? "Rechercher ma mosquée dans la liste" : "Ma mosquée n’est pas dans la liste"}
      </button>

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </fieldset>
  );
}
