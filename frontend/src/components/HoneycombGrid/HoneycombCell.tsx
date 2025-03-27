import React from 'react'
import './HoneycombGrid.css'

interface HoneycombCellProps {
  id: string
  title: string
  description: string
  color: string
  icon: string
  onClick: () => void
}

const HoneycombCell: React.FC<HoneycombCellProps> = ({
  id,
  title,
  description,
  color,
  icon,
  onClick,
}) => {
  return (
    <div
      className="honeycomb-cell"
      style={{ backgroundColor: color }}
      onClick={onClick}
      data-id={id}
    >
      <div className="honeycomb-content">
        <i className={`fas fa-${icon} honeycomb-icon`}></i>
        <h3 className="honeycomb-title">{title}</h3>
        <p className="honeycomb-description">{description}</p>
      </div>
    </div>
  )
}

export default HoneycombCell
