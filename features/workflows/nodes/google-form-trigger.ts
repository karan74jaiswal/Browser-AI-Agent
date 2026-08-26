export type GoogleFormTriggerOutput = {
  formId: string
  formTitle: string
  responseId: string
  timestamp: string
  respondentEmail: string
  responses: Record<string, unknown>
}

export function createDefaultGoogleFormTriggerOutput(): GoogleFormTriggerOutput {
  return {
    formId: "sample-form-id",
    formTitle: "Sample Form",
    responseId: "sample-response-id",
    timestamp: new Date().toISOString(),
    respondentEmail: "respondent@example.com",
    responses: {
      "Sample Question": "Sample Answer",
    },
  }
}
