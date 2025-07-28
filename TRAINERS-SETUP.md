# Trainer Setup Guide

## Setting up LM Studio

1. Install LM Studio from [https://lmstudio.ai/](https://lmstudio.ai/)

2. Install a small model for inference:
   - Recommended: [Google Gemma 3 1B](https://lmstudio.ai/models/google/gemma-3-1b)
   - Use any Q4 quantization option for optimal performance

![LM Studio Model Download](assets/lmStudioModelDownload.png)

3. Configure the server settings:
   - Enable developer mode
   - Navigate to the server tab
   - Open settings and set:
     - "Serve on Local Network" to **True**
     - "Auto unload unused JIT loaded models" to **False**

![LM Studio Settings](assets/lmStudioSettings.png)

4. Load the downloaded model and ensure the server is running

![LM Studio Enable Server](assets/lmStudioEnableServer.png)

5. Test the server:
   - Copy the cURL command using the button next to the model
   - Paste it into a bash terminal to verify the server is responding

6. Configure structured output:
   - In the right pane under "Inference", find the "Structured Output" section
   - Enable the feature by ticking the checkmark
   - Input the following JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Flashcards Response",
  "description": "A collection of question-answer flashcards extracted from content",
  "type": "object",
  "required": [
    "flashcards"
  ],
  "properties": {
    "flashcards": {
      "type": "array",
      "description": "An array of flashcard objects",
      "items": {
        "type": "object",
        "required": [
          "question",
          "answer"
        ],
        "properties": {
          "question": {
            "type": "string",
            "description": "The question part of the flashcard"
          },
          "answer": {
            "type": "string",
            "description": "The answer part of the flashcard"
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

![img.png](assets/lmStudioInferenceSchema.png)

## Setting Up Environment Variables

1. Create your environment file:
   - Copy the `.env.template` file to `.env`
   - Set the model name to match the model you downloaded in LM Studio
   - (You can copy the exact name using the copy button next to the model name in LM Studio)

> If you are just using it yourself locally. You can skip the next step and use http://localhost:1234/v1 as the inference server URL.

2. Forward the localhost through ngrok (make sure to monitor the traffic) to get a public inference server URL
  - You will need a ngrok account, afterwards you can follow the installation instructions on https://dashboard.ngrok.com/get-started
  - You will need to run ngrok in a separate terminal and keep it running, to start it run `ngrok http localhost:1234`
  - Use the URL that ngrok provides you with, it will look something like `https://<random-numbers>.ngrok-free.app` but your final url must include `/v1` at the end, so it should look like `https://<random-numbers>.ngrok-free.app/v1`
