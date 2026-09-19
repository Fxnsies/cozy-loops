import closed from "@/assets/reversible-toy-closed-original.jpeg.asset.json";
import opening from "@/assets/reversible-toy-opening-original.jpeg.asset.json";
import openHand from "@/assets/reversible-toy-open-hand-original.jpeg.asset.json";
import open from "@/assets/reversible-toy-open-original.jpeg.asset.json";

const frames = [closed.url, opening.url, openHand.url, open.url, openHand.url, opening.url, closed.url];

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