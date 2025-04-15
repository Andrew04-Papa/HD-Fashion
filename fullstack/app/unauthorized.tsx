import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Unauthorized() {
  return (
    <main className="container flex flex-col items-center justify-center min-h-[70vh] py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">401 - Unauthorized</h1>
      <p className="text-lg text-muted-foreground mb-8">You do not have permission to access this page.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to home page</Link>
        </Button>
      </div>
    </main>
  )
}

