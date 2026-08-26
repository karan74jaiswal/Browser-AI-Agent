/**
 * Generates an Apps Script snippet configured with the workflow webhook URL.
 */
export function generateGoogleFormScript(webhookUrl: string): string {
  return `/**
 * Google Form Webhook Dispatcher
 * Automatically dispatches responses to your workflow when submitted.
 * Setup: Add an 'On form submit' installable trigger under Triggers in Apps Script.
 */
function onFormSubmit(e) {
  if (!e || !e.response) {
    console.error("No form response found. Please ensure this is run through an 'On form submit' trigger.");
    return;
  }

  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  // Extract all questions and their corresponding answers
  var responses = {};
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    responses[item.getItem().getTitle()] = item.getResponse();
  }

  // Extract respondent email from Google account or fallback to any form question matching "email"
  var respondentEmail = formResponse.getRespondentEmail() || "";
  if (!respondentEmail) {
    for (var key in responses) {
      if (key.toLowerCase().indexOf("email") !== -1 && typeof responses[key] === "string") {
        respondentEmail = responses[key].trim();
        break;
      }
    }
  }

  var payload = {
    formId: e.source ? e.source.getId() : "",
    formTitle: e.source ? e.source.getTitle() : "",
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp() ? formResponse.getTimestamp().toISOString() : new Date().toISOString(),
    respondentEmail: respondentEmail,
    responses: responses,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  var WEBHOOK_URL = "${webhookUrl}";

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    console.log("Webhook dispatched: HTTP " + code + (body ? " - " + body : ""));
  } catch (error) {
    console.error("Failed to dispatch webhook:", error);
  }
}
`
}
