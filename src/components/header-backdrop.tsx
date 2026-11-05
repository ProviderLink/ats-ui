// Soft colour glows and fine diagonal lines behind a detail header. The parent
// needs `relative overflow-hidden`, and its content needs `relative` to sit on top.
export function HeaderBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute -top-10 -left-10 size-52 rounded-full bg-primary/[0.07] dark:bg-primary/[0.1] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-4 size-40 rounded-full bg-muted-foreground/[0.06] dark:bg-muted-foreground/[0.08] blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, currentColor 0, currentColor 0.5px, transparent 0, transparent 10px)",
        }}
      />
    </>
  );
}
