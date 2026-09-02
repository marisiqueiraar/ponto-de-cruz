import { ProjectWizard } from '../components/flow/ProjectWizard'
import { Icon } from '../components/common/Icon'
import { ProjectNameField } from '../components/common/ProjectNameField'
import { getSubstrate } from '../data/substrates'
import { DEFAULT_MAT_NAME, DEFAULT_PATTERN_NAME } from '../lib/project/projectName'
import { CONTENT_LABELS, currentObjective, useFlowStore } from '../state/useFlowStore'
import { useEditorStore } from '../state/useEditorStore'
import { useMatStore } from '../state/useMatStore'
import { GeneratorPage } from './GeneratorPage'
import { MatPage } from './MatPage'

export function CreatePage() {
  const configured = useFlowStore((s) => s.configured)
  const objectiveId = useFlowStore((s) => s.objectiveId)
  const contentType = useFlowStore((s) => s.contentType)
  const reset = useFlowStore((s) => s.reset)
  const patternName = useEditorStore((s) => s.projectName)
  const renameProject = useEditorStore((s) => s.renameProject)
  const matName = useMatStore((s) => s.project.name)
  const updateMatProject = useMatStore((s) => s.updateProject)

  if (!configured) return <ProjectWizard />

  const objective = currentObjective(objectiveId)
  const substrate = objective ? getSubstrate(objective.substrateId) : undefined
  const isMat = objective?.modality === 'moldura'

  return (
    <>
      <div className="project-bar">
        <div className="project-bar__inner">
          <span className="icon-tile icon-tile--sm">
            <Icon name={isMat ? 'photo' : 'layers'} size={17} />
          </span>
          <div className="project-bar__text">
            <ProjectNameField
              value={isMat ? matName : patternName}
              fallback={isMat ? DEFAULT_MAT_NAME : DEFAULT_PATTERN_NAME}
              onCommit={(name) => (isMat ? updateMatProject({ name }) : renameProject(name))}
            />
            <span>
              {objective?.name} · {contentType ? CONTENT_LABELS[contentType] : ''} · {substrate?.name} ·{' '}
              {objective?.count} ct
            </span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Trocar projeto
          </button>
        </div>
      </div>

      {isMat ? <MatPage /> : <GeneratorPage />}
    </>
  )
}
