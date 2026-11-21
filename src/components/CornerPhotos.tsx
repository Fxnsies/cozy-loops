const photos = [
  { src: "/bunny.jpg", alt: "Little white crochet bunny", pos: "left-3 top-4", tilt: "-6deg" },
  { src: "/frog-crown.jpg", alt: "Green crochet frog with a crown", pos: "right-3 top-4", tilt: "5deg" },
  { src: "/frog-plain.jpg", alt: "Green crochet frog", pos: "left-3 bottom-6", tilt: "7deg" },
  { src: "/turtle.jpg", alt: "Tiny crochet electric turtle", pos: "right-3 bottom-28", tilt: "-5deg" },
];

export function CornerPhotos() {
  return (
    <div aria-hidden={false} className="pointer-events-none hidden lg:block">
      {photos.map((p) => (
        <figure
          key={p.src}
          className={`fixed ${p.pos} z-10 w-36 rounded-sm border border-border bg-card p-2 pb-6 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.55)]`}
          style={{ transform: `rotate(${p.tilt})` }}
        >
          <img src={p.src} alt={p.alt} loading="lazy" className="h-32 w-full rounded-sm object-cover" />
          <figcaption className="absolute inset-x-0 bottom-1 text-center font-serif text-[11px] italic text-muted-foreground">
            made by hand
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
