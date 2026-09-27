<<<<<<< HEAD
# Taxi-Cume
Taxi services personal website
=======
# Cume Taxi Velika Plana — one-page sajt

Statična stranica napravljena iz Figma dizajna (`Radovi`, node `258:113`).
Bez build koraka, bez zavisnosti — otvoriš `index.html` i radi.

```
index.html          cela stranica
style.css           stilovi + design tokeni iz Figme
main.js             poziv na klik, lazy mape, lebdeće dugme
assets/
  fonts/            Plus Jakarta Sans (400/600/800, latin + latin-ext) — self-hosted
  img/              hero.jpg, banner.jpg   <-- OVO TREBA ZAMENITI
  icons/            izvorne SVG ikonice (u HTML-u su već ubačene kao sprite)
```

---

## 1. Šta obavezno treba zameniti

### Fotografije

U `assets/img/` su **placeholder** slike jer im nisam mogao pristupiti iz Figme
(rate limit + zatvorena mreža). Izvezi ih iz Figme i prepiši preko postojećih,
sa **istim imenima** — ništa drugo ne treba dirati:

| Fajl | Šta je | Preporučena veličina |
|---|---|---|
| `assets/img/hero.jpg` | Audi + grad, gornja sekcija | 2764 × 1454 (2×) |
| `assets/img/banner.jpg` | čovek sa telefonom, tamna sekcija | 2768 × 1284 (2×) |

Kompresuj ih (Squoosh, TinyJPG) na ispod ~250 KB svaka.

### Telefon i e-mail

Broj je na **jednom mestu** — vrh `main.js`:

```js
var CONTACT = {
  tel:       '+381638782339',
  telPretty: '+381 63 878 2339',
  viber:     '+381638782339',
  email:     'cumetaxi@gmail.com'
};
```

`main.js` pri učitavanju prepiše `href` na svim dugmadima. Ako menjaš broj,
promeni ga i u vidljivom tekstu (`index.html` — sekcija Lokacije i footer)
i u `application/ld+json` bloku u `<head>`.

---

## 2. Mape

Trenutno se koristi **keyless Google embed** — bez API ključa, bez kreditne kartice:

```
https://maps.google.com/maps?q=Centar,+Velika+Plana,+Srbija&z=15&hl=sr&output=embed
```

Da zakucaš tačan pin umesto pretrage po imenu mesta:

1. Otvori Google Maps, desni klik na tačnu lokaciju → klikni na koordinate (kopiraju se)
2. Zameni `q=` vrednost koordinatama, npr. `q=44.33312,21.07584`

Mape se učitavaju tek kad korisnik skroluje do njih (`main.js`), pa ne usporavaju
prvo učitavanje.

---

## 3. Poziv na klik

- Sva dugmad „Pozovi odmah" su `<a href="tel:...">` — na telefonu odmah otvaraju pozivnik.
- Na desktopu `tel:` nema šta da otvori, pa `main.js` umesto toga **kopira broj**
  i prikaže kratku poruku.
- Na telefonu se u zaglavlju krije dugme, a umesto njega se pojavljuje
  **fiksno žuto dugme na dnu ekrana** (pojavljuje se čim korisnik prođe hero).

Ako želiš i Viber dugme, `CONTACT.viber` je već tu — link je
`viber://chat?number=%2B381638782339`.

---

## 4. Deploy

### Cloudflare Pages (preporučeno, besplatno)

```bash
npm i -g wrangler
wrangler pages deploy . --project-name cume-taxi
```

Ili preko web UI: Cloudflare → Workers & Pages → Create → Pages →
Upload assets → prevučeš ceo folder.

### Netlify

Prevučeš folder na app.netlify.com/drop. Gotovo.

### Klasičan hosting (cPanel / FTP)

Iskopiraj sadržaj foldera u `public_html/`. Nema build koraka.

**Domen:** posle deploya dodaš `cumetaxi.rs` u podešavanjima hostinga i
usmeriš nameservere kod registra. SSL je automatski na sve tri opcije.

---

## 5. Šta je preostalo (predlozi)

- [ ] Prave fotografije iz Figme
- [ ] Favicon (`favicon.ico` + `apple-touch-icon.png`) — trenutno ga nema
- [ ] Google Business Profile za Cume Taxi (donosi više poziva nego sam sajt)
- [ ] Cloudflare Web Analytics (besplatno, bez kolačića → bez cookie banera)
- [ ] Ako se doda forma za rezervaciju — Netlify Forms ili Formspree, bez backenda

---

## Tehnički detalji

- **Fontovi:** self-hostovani woff2, `latin` + `latin-ext` subset (potrebno za š/đ/č/ć/ž),
  samo 3 težine → ~76 KB ukupno. Nema poziva ka Google Fonts (brže + GDPR-čisto).
- **Ikonice:** inline SVG sprite iz istih Iconify setova koje je dizajner koristio
  (`material-symbols-light:chair`, `solar:global-bold`, `streamline-flex:airport-plane-solid`,
  `material-symbols:luggage`, `osmic:pet-14`, `fluent:clock-24-filled`,
  `gridicons:arrow-up`, `mdi:email-outline`, `line-md:phone`). Nula HTTP zahteva.
- **Design tokeni** iz Figme su prevedeni u CSS custom properties na vrhu `style.css`
  (`--yellow: #f9ba27`, `--text-title: #131313`, `--text-body: rgba(19,19,19,.6)` …).
- **Tipografija** skalira preko `clamp()` sa referentne širine dizajna od 1382 px.
- **Breakpointi:** 1023 px (tablet, 3→2 kolone) i 767 px (mobilni, 1 kolona + fiksno dugme).
- **SEO:** `TaxiService` schema.org, OG tagovi, `lang="sr"`, semantični headings.
- **A11y:** vidljiv focus ring, `aria-label` na ikoničnim dugmadima, kontrast prolazi AA.
>>>>>>> bc7b710 (Cume Taxi Velika Plana - one-page website)
