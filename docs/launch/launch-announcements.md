# BookSwap Launch — Announcement Copy

Ready-to-post copy for the moment you click *Release This Version* and the
app goes live publicly. All copy is in **EN / FR / NL** to match the app's
i18n coverage and the launch markets (BE / NL / FR / LU primarily).

> **Don't post these until** the `bookswap-asc-public-check.sh` Telegram
> ping fires (= app is actually downloadable, not just released-but-still-
> propagating). A "We're live!" post that links to a 404 is the worst
> possible launch optic.

Last updated: 2026-05-02 (drafted ahead of approval; finalize after
approval to capture exact App Store URL slug).

---

## Channel matrix

| Channel | Audience | Tone | Post length |
|---|---|---|---|
| Personal X / Twitter | Tech-curious peers, indie devs | Build-in-public, story-driven | < 280 chars per post, threadable |
| Personal LinkedIn | Professional network, employers, peers | Reflective, lessons-learned | 1–3 short paragraphs |
| Reddit (r/belgium, r/Brussels, r/SideProject) | Local + indie-dev community | Helpful, conversational | 2–4 paragraphs, lead with the "why" |
| Product Hunt | Maker community, early adopters | Punchy, feature-led | Tagline + first-comment story |
| Hacker News (Show HN) | Skeptical technical audience | Honest, technical, no marketing speak | Title + 1-paragraph context |
| Email signature / personal site | Long-tail discovery | Quietly proud | 1 line + link |
| WhatsApp / personal network | Friends, family, beta testers | Warm, grateful | 1 short paragraph |
| Local press (Bruzz, Brussels Times) | Belgian readers | Civic / community angle | Pitch email, < 200 words |

---

## 🇬🇧 English

### X / Twitter — single-tweet announcement

```text
BookSwap is live on the App Store today 📚

Free book exchange app for the Brussels / Benelux region. List a book
you've finished, browse what's nearby, swap with a real human. No
money, no algorithm rabbit hole.

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
```

### X / Twitter — build-in-public thread (recommended)

> Post these as a thread (1/N format). Each tweet ≤ 280 chars.

```text
1/ Just shipped BookSwap to the App Store after ~3 months of evening
   and weekend coding 📚

   It's a free book-swap app for people in your neighbourhood — list
   what you've finished, browse what's nearby, swap. No money. No ads.

2/ Why I built it: my shelf was full of books I'd already read and the
   nearest second-hand bookshop is a 20-min walk. Felt like there had
   to be someone within 500m who'd want what I had.

   Turns out building "find someone near me who has X" is mostly
   PostGIS and patience.

3/ Stack:
   • Backend: Django 5 + PostGIS + Celery + Redis
   • Frontend (web): React 19 + Vite + TanStack Query + i18next
   • Mobile: Expo SDK 54 + React Native 0.81
   • Infra: self-hosted on a Raspberry Pi 5 + Cloudflare Tunnel

4/ Self-hosting on a Pi5 surprised me. With proper Docker resource
   limits + cgroups + a 4-worker Celery setup, it's been carrying
   prod for a week with idle CPU at < 5%.

   Cost: €0/month for hosting beyond the existing Pi I had.

5/ Hardest non-obvious problem: iOS push notification reconciliation.
   Expo accepts your ticket, APNs may still reject silently. Solved
   with a 15-min Celery beat job that polls Expo for receipts and
   deactivates dead device tokens.

6/ App Store review took ~24h end-to-end. Only blocker: I had
   `supportsTablet: true` without iPad screenshots, which forced a
   rebuild. Lesson: decide tablet support upfront.

7/ It's live now in BE / NL / FR / LU + ~165 other countries.
   I'd love it if you tried it (especially if you're in Brussels):

   iOS:     https://apps.apple.com/app/idREPLACE_ME
   Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
   Web:     https://book-swaps.com

   Feedback welcome — DMs open. 🙏
```

### LinkedIn — reflective post

```text
After ~3 months of evenings and weekends, BookSwap is live on the
App Store today 📚

It's a free, neighbourhood-scale book exchange app. List a book
you've finished. Browse what people near you are sharing. Arrange
a swap. No money changes hands; no subscriptions; no ads.

I built it because my shelf was full of books I'd already read,
and a friend's shelf nearby was full of books I wanted to read.
The internet should make that easier than walking to a bookshop.

The technical side, briefly:
- Django 5 backend, PostGIS for "books within 2km of me"
- React 19 web app with full PWA + offline cache
- React Native (Expo) iOS + Android apps with biometric login
- Hosted entirely on a Raspberry Pi 5 in my flat — €0/month infra
- Available in English, French, and Dutch from day one

A few thank-yous owed to the small group of friends who beta-tested
on TestFlight and put up with the rough edges.

Try it (especially if you're in the Brussels / Benelux region) and
let me know what's broken:

iOS:     https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web:     https://book-swaps.com
Source:  closed for now, but I'm happy to talk about the stack
```

### Reddit (r/belgium / r/Brussels) — community-first

```text
Title: I built a free book-swap app for Belgium — would love feedback from r/belgium

Hi r/belgium 👋

Just released BookSwap, a small app I've been building on the side
for the past few months. The idea is simple: list a book you've
finished reading, browse what other people in your neighbourhood are
willing to swap, arrange a meet-up, exchange. No money, no fees, no
subscriptions, no ads.

Why I built it:
- My shelves are full of books I've already read
- Second-hand bookshops in Brussels are decent but not always near
- Friends keep recommending books I want to read but can't always lend

The app is in English, French, and Dutch (and the listings are in
whatever language you put them in — no auto-translation magic, you
see what's actually there). It works in any city in Belgium / NL /
FR / LU but obviously needs people in your area for it to be useful,
which is why I'm posting here.

iOS:     https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web:     https://book-swaps.com

It's just me building this in my spare time, no funding, no team.
I'd really value any feedback — especially what's broken on your
device or what's confusing in your language.

(Mods: not sure if this counts as self-promotion since it's free
and non-commercial — happy to remove if it doesn't fit the sub.)
```

### Reddit (r/SideProject) — indie-dev focused

```text
Title: Show /r/SideProject: BookSwap — neighbourhood book exchange app, self-hosted on a Pi5

Hi all,

Shipped my side project this week — BookSwap, a hyperlocal book-
exchange app. Free, no ads, no subscriptions.

What it does:
- Add books you've finished and want to give away
- Browse a map of books available within a few km of you
- Request a swap, propose one of your own books in return
- Chat to arrange the handoff
- Rate the exchange after

Stack:
- Backend: Django 5 (ASGI) + DRF + PostGIS + Celery + Redis
- Frontend: React 19 + Vite + TanStack Query + i18next
- Mobile: Expo SDK 54 + React Native 0.81
- Infra: Docker Compose on a Raspberry Pi 5 (~€0/mo total infra cost),
  Cloudflare Tunnel for ingress, Sentry for monitoring
- CI: GitHub Actions self-hosted runner on the same Pi

Some honest learnings:
- Self-hosting on a Pi5 is genuinely viable for low-traffic SaaS if
  you set proper cgroup memory limits and don't over-commit Celery
  workers. I'm running idle at < 5% CPU
- iOS push notification ticket → receipt reconciliation is a trap
  for anyone using Expo. APNs can silently reject after Expo
  accepts; you need a poller to deactivate dead tokens
- App Store review approved in ~24h on the first proper submission,
  but I burned a day on stupid things like `supportsTablet: true`
  forcing iPad screenshot upload

Try it:
iOS:     https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web:     https://book-swaps.com

Happy to answer technical questions in the comments.
```

### Product Hunt — tagline + description

```text
Tagline (max 60 chars):
  BookSwap — Trade books with readers nearby. Free, local.

Description (max 260 chars):
  A free, hyperlocal book-exchange app. List what you've finished,
  browse what people near you have, arrange a swap. No money, no
  subscriptions, no ads — just books changing hands between real
  people in your neighbourhood. Web + iOS + Android.

First-comment story (longer-form, posted by maker):
  Hey Product Hunt 👋

  I built BookSwap because my flat was overflowing with books I'd
  already read and the nearest second-hand bookshop is a 20-min walk.
  The internet should be better at "I have X, you have Y, let's swap."

  This is a side project — no team, no funding. Built on Django +
  React + Expo, hosted on a Raspberry Pi 5 in my flat. Available in
  English, French, and Dutch.

  It works best where there are people, so it's most useful right now
  if you're in Brussels / Antwerp / Amsterdam / Paris. Anywhere else,
  you're welcome to be the first.

  I'd love any feedback — especially on the friction points in your
  first 5 minutes. DMs open.
```

### Hacker News — Show HN

```text
Title:
  Show HN: BookSwap – neighbourhood book exchange app, self-hosted on a Pi5

URL:
  https://book-swaps.com

Body (first comment):
  Hey HN. I built BookSwap as a side project — a free, hyperlocal
  book-exchange app for the Benelux region (but works anywhere).

  No money, no subscriptions, no ads. Just books changing hands
  between people in the same neighbourhood.

  Stack: Django 5 + PostGIS + Celery on the backend, React 19 + Vite
  on the web, Expo / React Native on iOS + Android. Hosted entirely
  on a Raspberry Pi 5 in my flat, behind Cloudflare Tunnel.

  Three things that surprised me building this:

  1. PostGIS makes "find books within 2km of me" trivial once you've
     understood SRID 4326 vs SRID 3857. Most of the discovery API is
     a single query with a `ST_DWithin` filter.

  2. iOS push notifications via Expo have a two-phase delivery model
     that's poorly documented. Expo accepts the ticket, then APNs may
     reject silently. You have to poll Expo's receipts endpoint to
     learn whether the device actually got it. I run a Celery beat
     job every 15 min to reconcile and deactivate dead tokens.

  3. Self-hosting on a Pi5 is genuinely viable if you (a) set
     `cgroup_enable=memory cgroup_memory=1` so Docker memory limits
     are enforced, (b) cap Celery to 4 workers, (c) put nginx in
     front for static asset caching. Idle CPU sits at < 5%.

  App Store review took ~24h. Play Store was 2h. Both went through
  on the first proper submission with no metadata issues — biggest
  time-sink was the privacy nutrition labels.

  Happy to answer questions about any of the above.
```

### Email signature / quiet announcement

```text
P.S. — I just shipped BookSwap, a free neighbourhood book-exchange app.
If you have a shelf of books you've finished, take a look:
https://book-swaps.com
```

### WhatsApp / personal network

```text
Hey 👋 just wanted to share — the side project I've been working on
the last few months is finally live on the App Store and Play Store.

It's called BookSwap — basically Vinted for books with people in
your neighbourhood, but free. No money, no ads, no subscriptions.
You list a book, someone nearby asks for it, you arrange to swap.

If you've got books gathering dust on a shelf and you fancy reading
something new without buying it, give it a go:

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap

Would love your honest feedback (especially if anything is broken
on your phone) 🙏
```

---

## 🇫🇷 Français

### X / Twitter — annonce simple

```text
BookSwap est disponible aujourd'hui sur l'App Store 📚

Application gratuite d'échange de livres pour Bruxelles et le Benelux.
Ajoutez un livre que vous avez fini, parcourez ce qui est disponible
près de chez vous, échangez avec un vrai humain. Pas d'argent, pas
d'algorithme.

iOS : https://apps.apple.com/app/idREPLACE_ME
Android : https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
```

### LinkedIn — version réflexive

```text
Après ~3 mois de soirées et de week-ends, BookSwap est disponible
sur l'App Store aujourd'hui 📚

C'est une application gratuite d'échange de livres à l'échelle du
quartier. Vous ajoutez un livre que vous avez terminé. Vous parcourez
ce que les gens près de chez vous partagent. Vous arrangez un
échange. Pas d'argent, pas d'abonnement, pas de publicité.

Je l'ai construite parce que mon étagère était pleine de livres que
j'avais déjà lus, et celle d'un ami à proximité était pleine de
livres que je voulais lire. Internet devrait rendre ça plus facile
qu'une visite chez le bouquiniste.

Côté technique, brièvement :
- Backend Django 5, PostGIS pour « livres à moins de 2 km »
- App web React 19 avec PWA + cache hors ligne
- Apps mobiles React Native (Expo) iOS + Android avec login biométrique
- Hébergement entier sur un Raspberry Pi 5 dans mon appartement
- Disponible en anglais, français et néerlandais dès le premier jour

Merci aux quelques amis bêta-testeurs qui ont supporté les bugs
sur TestFlight.

Essayez-la (surtout si vous êtes à Bruxelles ou en Belgique) et
dites-moi ce qui ne marche pas :

iOS : https://apps.apple.com/app/idREPLACE_ME
Android : https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web : https://book-swaps.com
```

### Reddit (r/belgique / r/france) — communautaire

```text
Titre : J'ai créé une application gratuite d'échange de livres pour la Belgique

Salut r/belgique 👋

Je viens de publier BookSwap, une petite app que je développe en
parallèle depuis quelques mois. L'idée est simple : ajoutez un livre
que vous avez fini de lire, parcourez ce que les autres dans votre
quartier proposent, organisez un rendez-vous, échangez. Pas d'argent,
pas de frais, pas d'abonnement, pas de publicité.

Pourquoi je l'ai créée :
- Mes étagères débordent de livres déjà lus
- Les bouquinistes à Bruxelles sont sympas mais pas toujours à côté
- Mes amis recommandent des livres que je veux lire mais ne peuvent
  pas toujours prêter

L'app est en français, néerlandais et anglais. Elle fonctionne dans
n'importe quelle ville de Belgique / Pays-Bas / France / Luxembourg
mais a évidemment besoin de gens dans votre zone pour être utile,
d'où ce post.

iOS : https://apps.apple.com/app/idREPLACE_ME
Android : https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web : https://book-swaps.com

C'est juste moi qui développe ça sur mon temps libre, pas de
financement, pas d'équipe. J'apprécierais énormément des retours —
surtout sur ce qui est cassé sur votre appareil ou pas clair en
français.
```

### WhatsApp / réseau personnel

```text
Coucou 👋 petit message pour partager — le projet perso sur lequel
je bosse depuis quelques mois est enfin disponible sur l'App Store
et le Play Store.

Ça s'appelle BookSwap — en gros Vinted pour les livres avec des
gens près de chez toi, mais gratuit. Pas d'argent, pas de pub, pas
d'abonnement. Tu ajoutes un livre, quelqu'un près de toi le demande,
vous arrangez l'échange.

Si t'as des livres qui prennent la poussière sur une étagère et que
t'as envie de lire quelque chose de nouveau sans acheter :

iOS : https://apps.apple.com/app/idREPLACE_ME
Android : https://play.google.com/store/apps/details?id=com.gnimoh.bookswap

Tes retours m'intéresseraient (surtout si quelque chose ne marche
pas sur ton téléphone) 🙏
```

---

## 🇳🇱 Nederlands

### X / Twitter — eenvoudige aankondiging

```text
BookSwap is vandaag beschikbaar in de App Store 📚

Gratis boekenruil-app voor Brussel en de Benelux. Voeg een boek toe
dat je hebt uitgelezen, bekijk wat er bij jou in de buurt is, ruil
met een echte mens. Geen geld, geen algoritme.

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
```

### LinkedIn — reflectieve versie

```text
Na ~3 maanden avonden en weekenden is BookSwap vandaag beschikbaar
in de App Store 📚

Het is een gratis boekenruil-app op buurtniveau. Je voegt een boek
toe dat je hebt uitgelezen. Je bekijkt wat mensen bij jou in de
buurt delen. Je regelt een ruil. Geen geld, geen abonnementen,
geen advertenties.

Ik heb het gebouwd omdat mijn boekenkast vol stond met boeken die
ik al had gelezen, en die van een vriend in de buurt vol stond met
boeken die ik wilde lezen. Het internet zou dat makkelijker moeten
maken dan een wandeling naar een tweedehands boekwinkel.

Technisch gezien, kort:
- Django 5 backend, PostGIS voor "boeken binnen 2 km van mij"
- React 19 web-app met volledige PWA + offline cache
- React Native (Expo) iOS + Android apps met biometrische login
- Volledig gehost op een Raspberry Pi 5 in mijn appartement
- Beschikbaar in Nederlands, Frans en Engels vanaf dag één

Dank aan de kleine groep vrienden die op TestFlight bètageteste
heeft en de ruwe randjes heeft verdragen.

Probeer het (vooral als je in Brussel / Antwerpen / Amsterdam zit)
en laat me weten wat er kapot is:

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web: https://book-swaps.com
```

### Reddit (r/thenetherlands / r/Belgium) — Dutch version

```text
Title: Ik heb een gratis boekenruil-app gemaakt voor België en Nederland

Hoi 👋

Ik heb net BookSwap uitgebracht, een kleine app waar ik al een paar
maanden in mijn vrije tijd aan werk. Het idee is simpel: voeg een
boek toe dat je hebt uitgelezen, bekijk wat anderen in jouw buurt
willen ruilen, regel een afspraak, ruil. Geen geld, geen kosten,
geen abonnement, geen advertenties.

Waarom ik het heb gemaakt:
- Mijn boekenkast staat vol met boeken die ik al heb gelezen
- Tweedehands boekwinkels zijn leuk maar niet altijd in de buurt
- Vrienden raden boeken aan die ik wil lezen maar niet altijd kunnen
  uitlenen

De app is in het Nederlands, Frans en Engels. Hij werkt in elke
stad in Nederland / België / Frankrijk / Luxemburg maar heeft
natuurlijk mensen in jouw gebied nodig om nuttig te zijn, vandaar
deze post.

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
Web: https://book-swaps.com

Het ben gewoon ik die dit in mijn vrije tijd bouwt, geen
financiering, geen team. Ik zou alle feedback waarderen — vooral
wat er kapot is op jouw apparaat of niet duidelijk is in het
Nederlands.
```

### WhatsApp / persoonlijk netwerk

```text
Hé 👋 even delen — het zijproject waar ik de laatste paar maanden
aan werk is eindelijk live in de App Store en Play Store.

Het heet BookSwap — eigenlijk Vinted voor boeken met mensen bij
jou in de buurt, maar dan gratis. Geen geld, geen advertenties,
geen abonnement. Jij voegt een boek toe, iemand in de buurt vraagt
ernaar, jullie spreken af om te ruilen.

Als je boeken hebt die stof verzamelen op een plank en je hebt
zin om iets nieuws te lezen zonder te kopen:

iOS: https://apps.apple.com/app/idREPLACE_ME
Android: https://play.google.com/store/apps/details?id=com.gnimoh.bookswap

Eerlijke feedback zou ik waarderen (vooral als iets niet werkt
op je telefoon) 🙏
```

---

## Local press pitch (Bruzz / Brussels Times / De Standaard)

### Email subject line options

- `Brussels-built free book-exchange app launches today — interview opportunity`
- `Local dev launches free neighbourhood book-swap app, no fees, no ads`
- `Hyperlocal book-exchange app for Brussels goes live today`

### Email body (~200 words)

```text
Hi <reporter name>,

I'm writing about a small project I'm launching today that might
interest your readers — particularly the lifestyle, tech, or
sustainability beats.

BookSwap (https://book-swaps.com) is a free book-exchange app I
built for the Brussels and Benelux region. The premise: list a book
you've finished reading, browse what people in your neighbourhood
have available, arrange to swap. No money changes hands, no
subscriptions, no advertising. The app is available on iOS, Android,
and the web in English, French, and Dutch.

A few angles that might be relevant:

- *Sustainability*: every swap is a book that doesn't get bought new
  or thrown away. Brussels alone throws out an estimated X tonnes of
  books each year (TODO: find a real source before pitching).
- *Local tech*: the entire infrastructure runs on a Raspberry Pi 5 in
  a Brussels flat — €0/month hosting cost. Built solo, no funding.
- *Community*: the app is intentionally hyperlocal. It works best when
  there are dozens of people in a single neighbourhood using it.

I'd be happy to demo the app or answer questions if any of that is
of interest. Apologies for the cold email.

Best,
Gideon Nimoh
admin@nimoh-ict.nl
+32 ...
https://book-swaps.com
```

---

## Pre-launch checklist (do these BEFORE posting any of the above)

- [ ] `bookswap-asc-public-check.sh` Telegram ping has fired (=app live)
- [ ] App Store URL works in incognito on a real device in BE / NL / FR
- [ ] Search "BookSwap" in App Store BE → app appears in top 3 results
- [ ] Privacy policy + support page load (https://book-swaps.com/{en,fr,nl}/{privacy-policy,support})
- [ ] Backend health endpoint green (curl https://api.book-swaps.com/api/v1/health/)
- [ ] Sentry has no Critical / Warning issues from the last 24h
- [ ] You have at least 1 freshly created account ready to demo with
- [ ] Replace every `idREPLACE_ME` in the copy above with the real ASC App ID slug
- [ ] Have a half-day blocked off for replies — first 24h of feedback is the most important
- [ ] Decide which channels to post on FIRST (recommend: WhatsApp → LinkedIn → X → Reddit → HN, in that order, ~30 min apart)

---

## Pre-launch don'ts

- ❌ Don't post to HN / Product Hunt before the App Store CDN is fully
  propagated — a "Show HN: site is broken" thread is the worst possible
  start. Wait until the public-check monitor has fired.
- ❌ Don't replace screenshots in ASC during launch week — every change
  triggers a fresh review.
- ❌ Don't drop the price (it's free already, but resist the urge to add
  a "supporter tier" in the first month).
- ❌ Don't change the privacy policy URL during the first 30 days.
- ❌ Don't reply to negative reviews in anger. Acknowledge, fix, ship,
  reply when calm. Apple looks at developer-reply tone in disputes.
