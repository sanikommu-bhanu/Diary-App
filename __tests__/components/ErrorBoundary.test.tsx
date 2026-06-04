import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "@/components/ErrorBoundary"

// Component that throws on demand
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test explosion 💥")
  return <div>All good ✅</div>
}

// Suppress console.error for expected throws
beforeAll(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterAll(() => (console.error as jest.Mock).mockRestore())

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText("All good ✅")).toBeInTheDocument()
  })

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    const fallback = <div>Custom error page</div>
    render(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText("Custom error page")).toBeInTheDocument()
  })

  it("calls onError callback when error occurs", () => {
    const onError = jest.fn()
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )
  })

  it("recovers when Try Again is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    // Re-render with non-throwing child
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText("All good ✅")).toBeInTheDocument()
  })
})
