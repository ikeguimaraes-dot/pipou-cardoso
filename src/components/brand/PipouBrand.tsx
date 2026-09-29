type PipouBrandProps = {
  width?: number;
  className?: string;
};

/** Original Pipou Academy artwork. Keep the lockup, color and aspect ratio intact. */
export function PipouBrand({ width = 168, className }: PipouBrandProps) {
  return (
    // Native image keeps this public asset compatible with the existing multi-zone shell.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pessoas/brand/pipou/logo-yellow.png"
      alt="Pipou Academy"
      width={2244}
      height={890}
      className={className}
      style={{ display: "block", width, maxWidth: "100%", height: "auto", objectFit: "contain" }}
    />
  );
}
