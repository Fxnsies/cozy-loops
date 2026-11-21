
const frames = [
  "/reversible-toy-closed-original.jpeg",
  "/reversible-toy-opening-original.jpeg",
  "/reversible-toy-open-hand-original.jpeg",
  "/reversible-toy-open-original.jpeg",
  "/reversible-toy-open-hand-original.jpeg",
  "/reversible-toy-opening-original.jpeg",
  "/reversible-toy-closed-original.jpeg",
];

export function ReversibleToyStopMotion() {
  return (
    <figure className="stop-motion mx-auto mt-8 max-w-sm" aria-label="A crochet toy opening and closing">
      <div className="stop-motion-window">
        {frames.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={index === 0 ? "Handmade reversible crochet toy opening into a yellow character" : ""}
            aria-hidden={index === 0 ? undefined : true}
            className="stop-motion-frame"
          />
        ))}
        <span className="stop-motion-stitch" aria-hidden="true" />
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        one little toy, two tiny surprises
      </figcaption>
    </figure>
  );
}
