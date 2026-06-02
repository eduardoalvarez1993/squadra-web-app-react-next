interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '8px',
  className,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted${className ? ` ${className}` : ''}`}
      style={{
        width:        typeof width  === 'number' ? `${width}px`  : width,
        height:       typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    />
  );
}
