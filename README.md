# akashpandey.com

This is my personal website for my research, field work, publications, skills,
and contact details.

Live site: [www.akashpandey.com](https://www.akashpandey.com/)

![Screenshot of the website](public/img/akashpandey.com_screenshot.webp)

## A small note

This is not a vibe-coded website. I did not give one prompt to an AI and publish
whatever came out. I made the first version myself, then kept changing it as I
learned what worked and what did not.

I have deliberately kept many parts simple and a little old-fashioned:

- Most content is in JSON and Markdown files under `src/data`.
- Photos, logos, and the CV are normal files under `public`.
- Images are converted to WebP before I put them on the site.
- Portfolio content does not need a CMS or a database.
- Pages use static data wherever possible, so less work is left for the browser.
- KASI answers some common questions locally before calling an external model.

These choices are not fashionable, but I can understand and edit them, and they
keep the site fairly predictable.

ChatGPT helped me a little with debugging, checking code, and a few things where
I was stuck. It did not decide the website or make the whole thing for me.

## How I made it

I started with Next.js and React, used Tailwind CSS for styling, and kept the
small UI pieces inside the repository. MapLibre renders OpenFreeMap's keyless
basemap. Public orbital data is fetched from CelesTrak and cached by the site.
KASI uses OpenRouter when a question needs a model. The contact form sends mail
through Resend.

The site is deployed on Vercel from this GitHub repository.

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

The normal pages work from the local files. KASI, contact mail, and optional
chat logging need the matching values from `.env.example`.

Before pushing a change, I normally run:

```bash
npm run build
```

## Editing the content

- `src/data/activities.json` contains activities and their links.
- `src/data/publications.json` contains papers, DOI links, and publication
  images.
- `src/data/skills.json` contains tools, instruments, and skill photos.
- `src/data/career.json` and `src/data/education.json` contain the timeline.
- `src/data/profile.md` contains the facts used by KASI.
- `src/data/privacy.md` is the privacy text shown on the site.
- `public/resume.pdf` is the CV linked from the home page.

Activity photos go in a folder under `public`. This command rebuilds the
`resolvedImages` lists from the real files:

```bash
npx ts-node scripts/resolve-activity-images.ts
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

Do not commit `.env.local`. It contains private keys.

## Thanks

Thanks to [tedawf.com](https://tedawf.com/) for the original inspiration,
especially the way photographs and research work are presented.

## License

The code is available under the [MIT License](LICENSE.txt).
