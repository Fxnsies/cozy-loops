const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export function LinkedText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(URL_RE);
  return (
    <p className="mt-1 whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        URL_RE.test(part) ? (
          <a
            key={i}
            href={part.startsWith("http") ? part : `https://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function ChatMessageBody(props: { body: string; imageUrl?: string | null }) {
  return (
    <>
      <LinkedText text={props.body} />
      {props.imageUrl && (
        <a href={props.imageUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={props.imageUrl}
            alt="Shared in the chat"
            loading="lazy"
            className="mt-2 max-h-64 w-auto rounded-xl border border-border/40 object-cover"
          />
        </a>
      )}
    </>
  );
}
