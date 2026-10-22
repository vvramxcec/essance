import React from 'react';
import { Sunrise, Cpu, Moon, Clock, LucideIcon } from 'lucide-react';
import { ClockStatus, TimeModeKey } from '../types';

interface InterestClockBannerProps {
  clockStatus: ClockStatus | null;
  activeMode: TimeModeKey | null;
  onSelectMode: (mode: TimeModeKey) => void;
}

const iconMap: Record<string, LucideIcon> = {
  Sunrise,
  Cpu,
  Moon
};

export default function InterestClockBanner({
  clockStatus,
  activeMode,
  onSelectMode
}: InterestClockBannerProps) {
  if (!clockStatus || !clockStatus.current_mode) return null;

  const currentModeInfo =
    clockStatus.available_modes.find((m) => m.key === activeMode) || clockStatus.current_mode;
  const CurrentIcon = iconMap[currentModeInfo.icon] || Clock;

  return (
    <div className="clock-banner">
      <div className="clock-info">
        <div className="clock-icon-bubble">
          <CurrentIcon size={24} />
        </div>
        <div>
          <div className="clock-heading">
            <span className="clock-title">{currentModeInfo.title}</span>
            <span className="clock-status-tag">
              Interest Clock Active (Hour {clockStatus.current_mode.hour}:00)
            </span>
          </div>
          <p className="clock-desc">{currentModeInfo.description}</p>
        </div>
      </div>

      <div className="clock-modes-selector">
        {clockStatus.available_modes.map((mode) => {
          const ModeIcon = iconMap[mode.icon] || Clock;
          const isActive = activeMode === mode.key;
          return (
            <button
              key={mode.key}
              className={`clock-mode-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.key)}
              title={mode.description}
            >
              <ModeIcon size={14} />
              <span>{mode.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
