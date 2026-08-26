interface ApplicationSilhouetteProps {
  templateId: string
}

/** Simple line-art silhouettes, drawn directly in the template's cm coordinate space (its viewBox). */
export function ApplicationSilhouette({ templateId }: ApplicationSilhouetteProps) {
  switch (templateId) {
    case 'almofada':
      return (
        <>
          <rect x={1} y={1} width={38} height={38} rx={2} className="silhouette-outline" />
          <rect x={2.5} y={2.5} width={35} height={35} rx={1.5} className="silhouette-seam" />
        </>
      )
    case 'pano-de-prato':
      return (
        <>
          <rect x={19} y={0} width={7} height={5} rx={2} className="silhouette-outline" />
          <rect x={2} y={4} width={41} height={64} rx={3} className="silhouette-outline" />
          <rect x={3.5} y={5.5} width={38} height={61} className="silhouette-seam" />
        </>
      )
    case 'quadro':
      return (
        <>
          <rect x={0.5} y={0.5} width={23} height={23} className="silhouette-frame" />
          <rect x={3} y={3} width={18} height={18} className="silhouette-seam" />
        </>
      )
    case 'camiseta':
      return <path d="M20,0 L30,0 L38,3 L50,10 L46,22 L38,15 L40,65 L10,65 L12,15 L4,22 L0,10 L12,3 Z" className="silhouette-outline" />
    default:
      return null
  }
}
