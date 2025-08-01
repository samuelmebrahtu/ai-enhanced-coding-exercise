import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import '../styles/DarkModeToggle.css';

export const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="dark-mode-toggle">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={isDarkMode}
          onChange={toggleDarkMode}
        />
        <span className="toggle-slider"></span>
      </label>
      <span className="toggle-label">
        {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </span>
      <div className="toggle-tooltip">
        {isDarkMode 
          ? 'Switch to light mode' 
          : 'Switch to dark mode'}
      </div>
    </div>
  );
};
