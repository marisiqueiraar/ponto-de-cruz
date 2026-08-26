import type { EngineStatus } from '../../state/useEditorStore'

interface EngineStatusPanelProps {
  status: EngineStatus
  message: string
}

const LABELS: Record<EngineStatus, string> = {
  idle: 'Aguardando imagem',
  computing: 'Calculando…',
  ready: 'Pronto',
  error: 'Erro',
}

export function EngineStatusPanel({ status, message }: EngineStatusPanelProps) {
  return (
    <div className={`engine-status engine-status--${status}`}>
      <span className="engine-status__dot" />
      <span>{LABELS[status]}</span>
      {message && <span className="engine-status__message">{message}</span>}
    </div>
  )
}
