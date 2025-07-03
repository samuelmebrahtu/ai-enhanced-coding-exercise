export interface LLMConfig {
  baseUrl: string
  model: string
  defaultApiKey: string
}

export const getLLMConfig = (): LLMConfig => {
  return {
    baseUrl: process.env.INFERENCE_SERVER_URL as string,
    model: process.env.MODEL_NAME as string,
    defaultApiKey: process.env.OPENAI_API_KEY as string
  }
}
