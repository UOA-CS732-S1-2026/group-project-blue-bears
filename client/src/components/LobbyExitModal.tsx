interface LobbyExitModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

function LobbyExitModal({ isOpen, onCancel, onConfirm }: LobbyExitModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="lobby-modal-backdrop" role="presentation">
      <div
        className="lobby-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
      >
        <h2 id="exit-dialog-title" className="lobby-modal-title">
          Exit match?
        </h2>
        <p className="lobby-modal-copy">
          Exiting this match will be treated as a surrender. Do you still want to
          leave?
        </p>
        <div className="lobby-modal-actions">
          <button className="lobby-modal-btn lobby-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="lobby-modal-btn lobby-modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default LobbyExitModal
