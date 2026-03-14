import { StatusModalProps } from '@/types'
import Modal from './ui/Modal'
import { CircleCheck, CircleX, Loader2 } from "lucide-react"

export default function StatusModal({ isOpen = false, onClose, status, message }: StatusModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} btn={false} btnx={false}>
      <div className="flex flex-col items-center justify-center gap-2 py-6">

        {status === "success" ? (
          <>
            <CircleCheck className='text-success w-12 h-12' />
            <p className="text-muted/80 text-sm font-semibold">{message}</p>
          </>
        ) : status === "verifying" ? (
          <>
            <Loader2 className='animate-spin text-primary w-12 h-12' />
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
