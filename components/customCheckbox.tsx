import { Check } from 'lucide-react';
import React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  id?: string;
  name?: string;
  label?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  size = 20,
  id,
  name,
  label,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        id={id}
        name={name}
        className="sr-only" // Hide the actual checkbox but keep it accessible
      />
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          inline-flex items-center justify-center
          border-2 text-gray1 border-gray2 rounded
          transition-all duration-200 p-px
          focus:outline-none focus:ring-2 focus:ring-gray5 focus:ring-offset-1 bg-white
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray00'}
        `}
        style={{ width: size, height: size }}
        tabIndex={0}
      >
        <Check className={`${checked?"visible":"invisible"}`} />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 text-sm text-gray1 cursor-pointer ${disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};
