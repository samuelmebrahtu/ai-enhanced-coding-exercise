import React, { useState, useEffect } from 'react'
import { LLMConfig, getLLMConfig, saveLLMConfig } from '../config'
import './LLMConfigForm.css'

interface LLMConfigFormProps {
  onConfigSaved: () => void
}

export const LLMConfigForm: React.FC<LLMConfigFormProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<LLMConfig>(getLLMConfig())
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveLLMConfig(config)
    setIsOpen(false)
    onConfigSaved()
  }

  const handleReset = () => {
    const defaultConfig = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo-1106'
    }
    setConfig(defaultConfig)
    saveLLMConfig(defaultConfig)
    onConfigSaved()
  }

  return (
    <div className="llm-config-container">
      <button 
        className="config-toggle-button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide LLM Settings' : 'LLM Settings'}
      </button>
      
      {isOpen && (
        <form className="llm-config-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="baseUrl">API Base URL</label>
            <input
              id="baseUrl"
              name="baseUrl"
              type="text"
              value={config.baseUrl}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1"
            />
            <small>For LMStudio, use http://localhost:1234 (without /v1)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="model">Model Name</label>
            <input
              id="model"
              name="model"
              type="text"
              value={config.model}
              onChange={handleChange}
              placeholder="gpt-3.5-turbo-1106"
            />
            <small>For LMStudio, use your model name (e.g., 'devstral-small-2505-mlx')</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="defaultApiKey">Default API Key (Optional)</label>
            <input
              id="defaultApiKey"
              name="defaultApiKey"
              type="password"
              value={config.defaultApiKey || ''}
              onChange={handleChange}
              placeholder="Optional default API key"
            />
            <small>For LMStudio, API key is not required (can be left blank)</small>
          </div>
          
          <div className="button-group">
            <button type="submit" className="save-button">Save Settings</button>
            <button type="button" className="reset-button" onClick={handleReset}>Reset to Default</button>
          </div>
        </form>
      )}
    </div>
  )
}
