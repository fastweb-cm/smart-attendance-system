import Modal from './ui/Modal'
import { CircleCheck, CircleX } from "lucide-react"

export default function StatusModal({ isOpen, onClose, status, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} btn={false}>
      <div className="flex flex-col items-center justify-center gap-2 py-6">

        {status === "success" ? (
          <>
            <CircleCheck className='text-success w-12 h-12' />
            <p className="text-muted/80 text-sm font-semibold">{message}</p>
          </>
        ) : (
          <>
            <CircleX className='text-danger w-12 h-12' />
            <p className="text-muted/80 text-sm font-semibold">{message}</p>
          </>
        )}

      </div>
    </Modal>
  )
}
