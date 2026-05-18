type FmLoadingStateProps = {
  title: string;
  body: string;
  inline?: boolean;
};

export function FmLoadingState({ title, body, inline = false }: FmLoadingStateProps) {
  return (
    <div className={`fm-loading-state ${inline ? "fm-loading-state--inline" : ""}`.trim()}>
      <div className="fm-loading-state__spinner" aria-hidden="true" />
      <div>
        <p className="fm-loading-state__title">{title}</p>
        <p className="fm-loading-state__body">{body}</p>
      </div>
    </div>
  );
}
