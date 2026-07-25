_Last updated: 26 July 2026_

## The short version

This is a personal portfolio. It has no advertising, marketing tracker, or
behavioural analytics. KASI chat, the contact form, the map, and the theme
switcher need a small amount of data to work.

## KASI chat

When you send a message to KASI, the site creates a random visitor ID and keeps
it in an HTTP-only cookie named hal_vid. The cookie lasts for up to one year. It
helps keep messages from the same visitor together. It is not used for
advertising.

KASI can store:

- your message and KASI's reply;
- an inferred display name, if the message contains one;
- the random visitor ID and conversation ID;
- the page where the message was sent; and
- technical notes such as the model used, response time, and which site content
  was used for the answer.

Depending on the server setup, those logs may be kept in PostgreSQL, sent to a
private Google Sheets webhook, written to a server file, or not stored at all.

Some short replies are produced on the website server. When a question needs an
AI model, the message and up to six recent chat messages are sent to OpenRouter.
OpenRouter sends them to the selected model provider. Do not put passwords,
financial details, medical details, or other sensitive information in KASI.

## Contact form

If you use the contact form, your name, email address, and message are sent to
Resend so the message can reach my email inbox. I use that information only to
read and reply to the message. I do not add it to a mailing list.

## Map, tiles, and satellite positions

MapLibre renders the map in your browser. The light and dark basemap styles and
tiles come from OpenFreeMap and use OpenStreetMap data. OpenFreeMap receives the
normal request details needed to send those files, such as your IP address,
browser information, and request time.

The site server fetches public orbital records from CelesTrak and caches them
for about six hours. Your browser receives only the small set of satellites
selected for the map. Visitors do not provide satellite data, and no visitor,
chat, or location data is sent to CelesTrak.

The map can ask your browser for optional location permission. If you allow it,
your coordinates stay in the open browser tab and are used to show your marker
and distance from me. They are not sent to my server, added to chat logs, or
saved in a database. You can deny or remove location permission in your browser.

## Theme and normal server logs

The light or dark theme choice is saved in your browser. Vercel and the other
providers named above may keep normal security and delivery logs when they serve
a request.

## Retention and deletion

I have not set one automatic deletion period for chat logs or contact emails.
They are kept while they are useful for running the site or replying to a
message. I do not sell or rent this information.

To ask me to find or delete something you submitted, email
[akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in) with enough detail to
identify it.

## Questions

For a privacy question, email
[akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in) or use the
[contact form](/contact).
