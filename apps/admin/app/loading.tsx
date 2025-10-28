export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        <p className="text-lg font-medium text-muted-foreground">Loading Newcondo Admin...</p>
      </div>
    </div>
  );
}