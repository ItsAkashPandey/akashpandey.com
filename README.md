# akashpandey.com

This is my personal website for my research, field work, publications, skills,
and contact details.

Live site: [www.akashpandey.com](https://www.akashpandey.com/)

![Screenshot of the website](public/img/akashpandey.com_screenshot.webp)

## A small note

This is not a vibe-coded website. I made it for myself and still change it when
I learn something new. I deliberately keep the content in JSON and Markdown,
store the photos and CV as normal files, and use static pages where possible.
It is a little old-fashioned, but it is quick and easy for me to edit. I took
some help from ChatGPT when I got stuck.

## How I made it

I started with Next.js and React, used Tailwind CSS for styling, and kept the
small UI pieces inside the repository. MapLibre renders NASA GIBS satellite
imagery. CelesTrak supplies the public orbital data, and Three.js draws the
small satellite models and side scenes. KASI answers common questions locally
and uses OpenRouter when it needs a model. The contact form sends mail through
Resend.

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
npm run lint
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
especially the way photographs and research work are presented. The open-source
[WorldWideView](https://github.com/silvertakana/worldwideview) project was also
useful while I was learning how orbit tracks can be presented.

## License

The code is available under the [MIT License](LICENSE.txt).
