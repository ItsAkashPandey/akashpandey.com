# akashpandey.com

This is my personal website for my research, field work, publications, skills,
and contact details.

Live site: [www.akashpandey.com](https://www.akashpandey.com/)

![Screenshot of the website](public/img/akashpandey.com_screenshot.webp)

## A small note

This is not a vibe-coded website. I made it for myself and still change it when
I learn something new. I deliberately keep the content in JSON and Markdown,
store the photos and CV as normal files, and use static pages where possible.
It is a little old-fashioned, but it is quick for me to edit and easy to host.
I took some help from ChatGPT when I got stuck.

The photo stack on the home page is inspired by the clean stacked-card feeling
on [tedawf.com](https://tedawf.com). Thank you for the design inspiration.

## How I made it

The site uses Next.js, React, Tailwind CSS, and a few small local components.
Most content lives in `src/data` as JSON or Markdown. Photos and documents live
in `public`, so I can update the site without touching too much code.

MapLibre renders the map. NASA GIBS is used for the low-zoom satellite view,
Esri imagery helps at high zoom, CelesTrak supplies public orbital records, and
satellite.js calculates the ground positions and tracks. KASI answers common
questions from local site knowledge and can use OpenRouter when needed. The
contact form sends email through Resend.

## Run it locally

You need a recent Node.js version and npm.

```powershell
git clone https://github.com/ItsAkashPandey/akashpandey.com.git
cd akashpandey.com
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The normal pages work from local files. KASI, contact mail, optional chat
logging, and live satellite refresh need the matching values from `.env.example`.

Before pushing a change, I normally run:

```bash
npm run lint
npm run build
```

## Editing the content

- `src/data/activities.json` has activities and links.
- `src/data/publications.json` has papers, DOI links, and publication images.
- `src/data/skills.json` has tools, instruments, and skill photos.
- `src/data/career.json` and `src/data/education.json` have the timeline.
- `src/data/profile.md` has the facts used by KASI.
- `src/data/privacy.md` is the privacy page text.
- `public/resume.pdf` is the CV linked from the home page.

Activity photos go in a folder under `public`. This command rebuilds the
`resolvedImages` lists from the real files:

```bash
npx ts-node scripts/resolve-activity-images.ts
```

New photos are large, so I shrink them before committing:

```bash
node scripts/optimize-images.mjs
```

I keep external links in the same JSON record as the related activity or
publication. I check a link before adding it instead of guessing a post URL.

## Useful links

- [Website](https://www.akashpandey.com/)
- [LinkedIn](https://www.linkedin.com/in/iamakashpandey/)
- [GitHub profile](https://github.com/ItsAkashPandey)
- [ORCID](https://orcid.org/0009-0009-0757-6276)

## Deployment

The `main` branch is connected to Vercel. Add the required environment variables
in Vercel, push to `main`, and Vercel builds the site.

Admin sign-in reads `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`
from the environment. There is no default, so if those are missing the admin page
simply refuses every login.

Saving the KASI chat messages needs a database or a Google Sheet. The setup for
both is written down in [docs/chat-logging.md](docs/chat-logging.md).

Do not commit `.env.local`. It contains private keys.

## Credits for the 3D models and background clips

The satellites on the map are the real NASA models from
[NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources). The short
background clips behind each page come from the
[NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/). Both are
public domain. I trimmed and re-encoded the clips so they are small enough to
serve; the full list with links is in `public/motion/attribution.txt`.

## Thanks

Thanks to [tedawf.com](https://tedawf.com/) for the original inspiration,
especially the way photographs and research work are presented. The open-source
[WorldWideView](https://github.com/silvertakana/worldwideview) project was also
useful while I was learning how orbit tracks can be presented.

## License

The code is available under the [MIT License](LICENSE.txt).
