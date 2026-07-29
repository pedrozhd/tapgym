/**
 * Splash fullscreen da LP (desktop). No mobile o hero já vem no HTML (LCP);
 * em viewports md+ este overlay cobre o first paint até o palco 3D montar —
 * sem spoiler das seções de baixo e sem atrasar o texto no celular.
 */
export function LandingLoader({ progress = 0 }: { progress?: number }) {
  return (
    <div className="rg-loader" role="status" aria-live="polite">
      <span className="rg-loader__word">TAPGYM</span>
      <div className="rg-loader__bar">
        <div className="rg-loader__bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
