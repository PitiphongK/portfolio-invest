import { LoginForm } from "@/components/login-form"
import { connection } from "next/server";
import { Suspense } from "react"

export default async function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
