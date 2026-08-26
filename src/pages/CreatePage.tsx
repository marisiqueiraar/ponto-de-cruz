import { ProjectWizard } from '../components/flow/ProjectWizard'
import { Icon } from '../components/common/Icon'
import { getSubstrate } from '../data/substrates'
import { CONTENT_LABELS, currentObjective, useFlowStore } from '../state/useFlowStore'
import { GeneratorPage } from './GeneratorPage'
import { MatPage } from './MatPage'

export function CreatePage() {
  const configured = useFlowStore((s) => s.configured)
  const objectiveId = useFlowStore((s) => s.objectiveId)
  const contentType = useFlowStore((s) => s.contentType)
  const reset = useFlowStore((s) => s.reset)

  if (!configured) return <ProjectWizard />

  const objective = currentObjective(objectiveId)
  const substrate = objective ? getSubstrate(objective.substrateId) : undefined

  return (
    <>
      <div className="project-bar">
        <div className="project-bar__inner">
          <span className="icon-tile icon-tile--sm">
            <Icon name={objective?.modality === 'moldura' ? 'photo' : 'layers'} size={17} />
          </span>
          <div className="project-bar__text">
            <strong>{objective?.name}</strong>
            <span>
              {contentType ? CONTENT_LABELS[contentType] : ''} · {substrate?.name} · {objective?.count} ct
            </span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Trocar projeto
          </button>
        </div>
      </div>

      {objective?.modality === 'moldura' ? <MatPage /> : <GeneratorPage />}
    </>
  )
}
