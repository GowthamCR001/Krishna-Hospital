/**
 * ==============================================================================
 * KRISHNA HOSPITAL - GOOGLE APPS SCRIPT WEBHOOK FOR FORM SUBMISSIONS
 * ==============================================================================
 * 
 * Target Google Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1svK_6Fbfx5W1ngfVgTw52SCgqUIONuYUMHEzGHwXHNQ/edit
 * 
 * Forms Connected:
 * 1. Home Page: "Make An Appointment / Apply For Treatments"
 * 2. Appointment Page: "Book Doctor Consultation"
 * 3. Contact Us Page: "Get In Touch"
 * 
 * ==============================================================================
 * EASY DEPLOYMENT INSTRUCTIONS (Takes less than 1 minute):
 * 1. Open your Google Sheet in your browser:
 *    https://docs.google.com/spreadsheets/d/1svK_6Fbfx5W1ngfVgTw52SCgqUIONuYUMHEzGHwXHNQ/edit
 * 
 * 2. In the top menu bar, click: Extensions > Apps Script
 * 
 * 3. In the code editor that opens, delete any existing default text (myFunction)
 *    and paste this entire file's code.
 * 
 * 4. Click the Save icon (Ctrl + S or disk icon).
 * 
 * 5. In the top-right corner, click the blue "Deploy" button > "New deployment".
 * 
 * 6. Click the gear icon (Select type) next to "Select type" and choose "Web app".
 * 
 * 7. Fill out the deployment settings:
 *    - Description: Krishna Hospital Form Webhook
 *    - Execute as: Me (your Google email)
 *    - Who has access: Anyone  <-- (IMPORTANT: Must be "Anyone" so visitors can submit forms!)
 * 
 * 8. Click "Deploy".
 *    - If Google prompts "Authorization required", click "Authorize access".
 *    - Select your Google account.
 *    - If you see "Google hasn't verified this app", click "Advanced" (at bottom).
 *    - Click "Go to Untitled project (unsafe)".
 *    - Click "Allow".
 * 
 * 9. Copy the generated "Web app URL" (starts with https://script.google.com/macros/s/...).
 * 
 * 10. Paste that Web App URL into:
 *     assets/js/dz.ajax.js (in the GOOGLE_SHEET_WEB_APP_URL variable).
 * ==============================================================================
 */

// Spreadsheet ID from the URL provided
const SPREADSHEET_ID = "1svK_6Fbfx5W1ngfVgTw52SCgqUIONuYUMHEzGHwXHNQ";

// Test endpoint: Open the Web App URL in your browser to verify it is online
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Krishna Hospital Google Sheets Form Webhook is online and ready!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// Main handler for form POST submissions
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000); // 15 second lock to prevent concurrent write collisions

  try {
    let sheet;
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.getActiveSheet() || ss.getSheets()[0];
    } catch (err) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }

    // Auto-initialize Header Row if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Submission Time (IST)",
        "Form Type",
        "Full Name",
        "Phone Number",
        "Email Address",
        "Department / Speciality",
        "Preferred Doctor",
        "Preferred Date",
        "Preferred Time Slot",
        "Age",
        "Gender",
        "Message / Symptoms",
        "Status"
      ];
      sheet.appendRow(headers);

      // Apply Hospital Brand Styling to Header Row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0069ab"); // Hospital Primary Blue
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setFontSize(11);
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Parse parameters from either JSON body or URL-encoded form data
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Extract Form Type
    const formType = data.formType || data.dzToDo || "Website Form";

    // Extract Full Name (handles single name or firstName + lastName)
    let fullName = data.dzName || "";
    if (!fullName && (data.dzFirstName || data.dzLastName)) {
      fullName = ((data.dzFirstName || "") + " " + (data.dzLastName || "")).trim();
    }
    if (!fullName) fullName = data.name || data.fullName || "N/A";

    // Extract Contact Details
    const phone = data.dzPhoneNumber || data.phone || data.mobile || "";
    const email = data.dzEmail || data.email || "";

    // Extract Medical Preferences
    const speciality = data.dzSpeciality || data["dzOther[Services]"] || data.speciality || data.department || "";
    const doctor = data.dzDoctor || data.doctor || "";
    const date = data.dzDate || data.date || "";
    const timeSlot = data.dzTimeSlot || data.timeSlot || "";
    const age = data.dzAge || data.age || "";
    const gender = data.dzGender || data.gender || "";
    const message = data.dzMessage || data.message || data.symptoms || "";

    // Format IST Timestamp (Indian Standard Time)
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, "Asia/Kolkata", "dd-MMM-yyyy hh:mm:ss a");

    // Append submission row
    const newRow = [
      formattedDate,
      formType,
      fullName,
      phone,
      email,
      speciality,
      doctor,
      date,
      timeSlot,
      age,
      gender,
      message,
      "New Request"
    ];

    sheet.appendRow(newRow);

    // Auto-fit column widths for readability on initial entries
    if (sheet.getLastRow() <= 5) {
      for (let col = 1; col <= newRow.length; col++) {
        sheet.autoResizeColumn(col);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      status: 1,
      message: "Form submission recorded successfully in Krishna Hospital spreadsheet."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      status: 0,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
