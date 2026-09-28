_Last updated: 28 September 2026_

## The short version

This is a personal portfolio. It has no ads, marketing trackers or
behavioural analytics. Kasi (the chat), the contact form, the map and the
theme switch need a small amount of data to work, described below.

## Kasi chat

When you send Kasi a message, the site sets a random visitor ID in an
HTTP-only cookie called `kasi_vid`. It lasts up to a year and only groups your
messages together in the logs. It is not used for advertising.

For each message, the log can hold:

- your message and Kasi's reply;
- your name, if you introduce yourself ("my name is …");
- the random visitor ID and a conversation ID;
- the page you were on; and
- technical notes such as the model used, the response time and which of the
  site's activities were looked up for the answer.

Depending on how the server is set up, the log is kept in a PostgreSQL
database or a private Google Sheet, or not kept at all. Logs are deleted
automatically after 180 days.

Short replies such as greetings come from the website itself. Everything else
is answered by an AI model: your message and up to eight recent messages from
the same conversation are sent to one of the model providers the site uses
(Cerebras, Groq, Google's Gemini API or OpenRouter, whichever is available).
These run on free plans, and some free plans allow the provider to use what is
sent to improve their models. Please don't put passwords, financial or medical
details, or anything else sensitive in the chat.

The conversation is also kept in your browser tab (session storage) so it
survives a page change or reload. It is gone when you close the tab or press
"Clear chat".

## Contact form

Your name, email address and message are sent through Resend so they reach my
inbox. I use them only to read and answer your message, and I don't add anyone
to a mailing list. If the spam check is switched on, Cloudflare Turnstile sees
the usual technical details of your browser to tell people from bots.

## Spam and abuse limits

To stop floods of messages, the site counts requests per IP address for a few
minutes (in memory, or in an Upstash Redis store). The counts expire on their
own and are not used for anything else.

## Map

MapLibre draws the map in your browser. Map tiles come from OpenFreeMap and
the satellite imagery from Esri. Those servers receive the normal request
details needed to send a tile, such as your IP address, browser and time.

The distance feature can ask your browser for your location. If you allow it,
your coordinates stay in the open tab: they are used to place your marker and
measure the distance to Roorkee, and are never sent to my server, added to the
chat logs or saved.

## Theme and server logs

Your light, dark or system theme choice is saved in your browser. Vercel, which
hosts the site, and the other services named above keep their normal security
and delivery logs.

## Deleting your data

I don't sell or rent any of this. To have something you sent found or deleted
before the 180 days are up, email
[akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in) with enough detail to
identify it.

## Questions

Email [akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in) or use the
[contact form](/contact).
