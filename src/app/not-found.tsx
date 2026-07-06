export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
    </div>
  );
}
