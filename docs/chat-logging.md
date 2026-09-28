# Chat logging

Kasi writes one row per message. `src/lib/chat-log.ts` tries three
destinations in order and stops at the first that works:

1. `CHAT_LOG_WEBHOOK_URL` — a Google Apps Script web app backed by a Sheet
2. `CHAT_LOG_DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL` — Postgres
3. `CHAT_LOG_FILE_PATH` — a local JSONL file (development only)

The file destination does not survive on Vercel, because the filesystem is
rebuilt on every deploy. Use one of the first two in production.

Logs are deleted after `CHAT_LOG_RETENTION_DAYS` days (180 if unset, `0` to
keep everything). Postgres prunes itself; the Sheet script below does the
same on each write.

## Option A — Postgres (recommended)

Any Postgres works. On Vercel, Storage → Neon gives a free database and injects
`POSTGRES_URL` automatically, which the code already reads. Nothing else to do:
the table and its indexes are created on first write.

To point at a database yourself, set `CHAT_LOG_DATABASE_URL` in the Vercel
project's environment variables and redeploy.

TLS certificates are verified. If your provider's certificate isn't trusted by
Node (some Supabase setups), add `?sslmode=no-verify` to the URL or set
`CHAT_LOG_DATABASE_SSL=no-verify`.

## Option B — Google Sheets

Create a Sheet, then Extensions → Apps Script, and replace the contents of
`Code.gs` with the script below. Set `SHEET_ID` to the id in the Sheet's URL and
`TOKEN` to the same value as `CHAT_LOG_WEBHOOK_TOKEN`.

Deploy with **Deploy → New deployment → Web app**:

- Execute as: **Me**
- Who has access: **Anyone**

"Execute as: Me" is the part that matters. If the deployment runs as the calling
user instead, the script has no rights to the Sheet and every request comes back
as `Exception: You do not have permission to access the requested document` —
with an HTTP 200 status, which is why a broken setup can look healthy.

Re-deploying an existing web app creates a new URL unless you edit the existing
deployment and bump its version. Update `CHAT_LOG_WEBHOOK_URL` if the URL changes.

Everything goes over POST, so the token never ends up in a URL. The site also
prefixes any value starting with `=`, `+`, `-` or `@` with an apostrophe before
sending it, so a chat message can't turn into a live formula; the script sets
the columns to plain text as a second guard.

```javascript
const SHEET_ID = "PUT_THE_SHEET_ID_HERE";
const SHEET_NAME = "chat_logs";
const TOKEN = "PUT_THE_SAME_VALUE_AS_CHAT_LOG_WEBHOOK_TOKEN";
const RETENTION_DAYS = 180; // 0 keeps everything

const HEADERS = [
  "timestamp",
  "visitorId",
  "visitorName",
  "conversationId",
  "role",
  "message",
  "notes",
];

function getSheet() {
  const book = SpreadsheetApp.openById(SHEET_ID);
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).setNumberFormat("@");
  }
  return sheet;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function prune(sheet) {
  if (!RETENTION_DAYS) return;
  const cutoff = Date.now() - RETENTION_DAYS * 86400000;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const stamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let expired = 0;
  while (expired < stamps.length && new Date(stamps[expired][0]).getTime() < cutoff) {
    expired++;
  }
  if (expired) sheet.deleteRows(2, expired);
}

function read(sheet, params) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { rows: [] };

  const limit = Math.min(Number(params.limit) || 200, 2000);
  const start = Math.max(2, lastRow - limit + 1);
  const values = sheet
    .getRange(start, 1, lastRow - start + 1, HEADERS.length)
    .getValues();

  let rows = values.map(function (value) {
    const row = {};
    HEADERS.forEach(function (key, index) {
      row[key] = value[index] === "" ? null : String(value[index]);
    });
    return row;
  });

  if (params.visitorId) {
    rows = rows.filter(function (row) {
      return row.visitorId === params.visitorId;
    });
  }
  if (params.conversationId) {
    rows = rows.filter(function (row) {
      return row.conversationId === params.conversationId;
    });
  }

  return {
    rows: rows,
    viewUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID,
  };
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (TOKEN && body.token !== TOKEN) {
      return json({ error: "Unauthorized" });
    }

    const sheet = getSheet();

    if (body.action === "read") {
      return json(read(sheet, body));
    }

    if (body.action === "reset") {
      sheet.clear();
      sheet.getDataRange().clearDataValidations();
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).setNumberFormat("@");
      return json({ reset: true });
    }

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) {
      return json({ written: 0 });
    }

    const values = rows.map(function (row) {
      return HEADERS.map(function (key) {
        const value = row[key] == null ? "" : String(row[key]);
        return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
      });
    });

    const range = sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      values.length,
      HEADERS.length,
    );
    range.setNumberFormat("@");
    range.setValues(values);
    prune(sheet);

    return json({ written: values.length });
  } catch (error) {
    return json({ error: String(error) });
  }
}
```

An older copy of this script read logs through `doGet` with the token in the
query string. The admin page still understands it, but shows a note until the
script is replaced with the one above.

## Checking which destination is live

Sign in at `/admin`. The page shows the source (`Google Sheets`, `Postgres`,
`Local file` or nothing) and, when a destination fails, a message explaining
why it fell through.
