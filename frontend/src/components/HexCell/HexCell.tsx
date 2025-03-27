import React from 'react'
import './HexCell.css'

export interface HexCellProps {
  id: string
  title: string
  description?: string
  icon?: string
  color?: string
  gradient?: string
  onClick: () => void
  size?: 'small' | 'medium' | 'large'
  isActive?: boolean
}

const HexCell: React.FC<HexCellProps> = ({
  id,
  title,
  description,
  icon = 'tasks',
  color,
  gradient,
  onClick,
  size = 'medium',
  isActive = false,
}) => {
  // Определяем стиль фона
  const getBgStyle = () => {
    if (gradient) {
      return { background: gradient }
    }
    if (color) {
      return { backgroundColor: color }
    }
    return {}
  }

  return (
    <div
      className={`hex-cell ${size} ${isActive ? 'active' : ''}`}
      style={getBgStyle()}
      onClick={onClick}
      data-id={id}
    >
      <div className="hex-content">
        <div className="hex-icon">
          <i className={`fas fa-${icon}`}></i>
        </div>
        <h3 className="hex-title">{title}</h3>
        {description && <p className="hex-description">{description}</p>}
      </div>

      {/* Анимация "свечения" для сот */}
      <div className="hex-glow"></div>

      {/* Обводка для шестиугольника */}
      <div className="hex-border"></div>
    </div>
  )
}

export default HexCell
