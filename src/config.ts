export interface LLMConfig {
  baseUrl: string
  model: string
  defaultApiKey?: string
}

export const defaultConfig: LLMConfig = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo-1106'
}

export const getLLMConfig = (): LLMConfig => {
  try {
    const storedConfig = localStorage.getItem('llm_config')
    if (storedConfig) {
      return JSON.parse(storedConfig) as LLMConfig
    }
  } catch (error) {
    console.error('Error loading LLM config:', error)
  }
  
  return defaultConfig
}

export const saveLLMConfig = (config: LLMConfig): void => {
  try {
    localStorage.setItem('llm_config', JSON.stringify(config))
  } catch (error) {
    console.error('Error saving LLM config:', error)
  }
}
