import { BookOpen } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <BookOpen className="size-4" />
            </div>
            SIMMAS
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">Selamat Datang</h1>
              <p className="text-muted-foreground">
                Masuk ke Sistem Manajemen Magang Siswa
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        {/* <img
          src="/images/students-internship.jpg"
          alt="Students in internship"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-background/40" />
        <div className="absolute bottom-6 left-6 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Sistem yang memudahkan pengelolaan magang siswa dengan fitur yang lengkap dan mudah digunakan."
            </p>
            <footer className="text-sm">SMK Negeri 1 Surabaya</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
