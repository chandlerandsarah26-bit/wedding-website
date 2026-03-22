// netlify/functions/rsvp.js
// Receives RSVP form data and appends a row to Google Sheets.
//
// Required environment variables (set in Netlify UI → Site config → Environment variables):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  – the service account email from your credentials JSON
//   GOOGLE_PRIVATE_KEY            – the private key (paste the full key including -----BEGIN/END-----)
//   GOOGLE_SHEET_ID               – the spreadsheet ID from the Sheet URL

const { google } = require("googleapis");

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // CORS headers so your website can call this function
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const data = JSON.parse(event.body);

    // Authenticate with Google using a service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Build the row — column order matches the header row you'll create manually in the sheet
    const row = [
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" }), // Timestamp
      data.fname,
      data.lname,
      data.email,
      data.attending === "yes" ? "Attending" : "Not Attending",
      data.spouse === "yes" ? "Yes" : "No",
      data.spouseName || "",
      data.meal || "",
      data.dietary || "",
      data.cocktail || "",
      data.song || "",
      data.arriveDay || "",
      data.arriveTime || "",
      data.departDay || "",
      data.departTime || "",
      data.note || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:P",
      valueInputOption: "USER_ENTERED",
      resource: { values: [row] },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("RSVP function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
