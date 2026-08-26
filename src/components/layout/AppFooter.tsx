export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span>© {new Date().getFullYear()} Ponto de Cruz — seus padrões ficam salvos só no seu navegador.</span>
        <span className="app-footer__tagline">"Um quadradinho de cada vez."</span>
      </div>
    </footer>
  )
}
