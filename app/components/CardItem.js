
import * as React from 'react'

export function CardItem({ item, timeActive, className }) {
    return (
        <div className={`card ${className}`}>
            <div className="card-header">
                <h3 className="card-title">{item.title}</h3>
                <p className="card-subtitle">{item.subtitle}</p>
            </div>
            <div className="card-body">
                <p>{item.description}</p>
            </div>
            <div className="card-footer">
                <span>{item.start} - {item.end}</span>
                {timeActive && <span className="active-indicator">Active</span>}
            </div>
        </div>
    );
}