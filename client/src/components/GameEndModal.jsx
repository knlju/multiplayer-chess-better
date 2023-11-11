import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import "./GameEndModal.css"

const GameEndModal = ({
  children,
  onClose,
  onRematch,
  rematchOffered,
  onAcceptRematch,
}) => {
  const modalRoot = document.getElementById("modal-root")
  const el = document.createElement("div")

  useEffect(() => {
    modalRoot.appendChild(el)
    return () => {
      modalRoot.removeChild(el)
    }
  }, [el, modalRoot])

  const handleCloseClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={handleCloseClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          X
        </button>
        {children}
        {rematchOffered ? (
          <button onClick={onAcceptRematch}>Accept Rematch</button>
        ) : (
          <button onClick={onRematch}>Rematch</button>
        )}
      </div>
    </div>,
    el,
  )
}

export default GameEndModal
