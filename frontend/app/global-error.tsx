"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Critical Error
            </h1>
            <p className="text-gray-600 mb-4">
              Something went wrong at the application level.
            </p>
            <button
              onClick={reset}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}