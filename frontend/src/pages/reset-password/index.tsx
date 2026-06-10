import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function ResetPasswordPage() {
  const router = useRouter();
  // Menangkap token dari URL (?token=...)
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    // Validasi token ada
    if (!token) {
      setErrorMessage("Tautan tidak valid atau token tidak ditemukan.");
      return;
    }

    // Validasi password cocok
    if (password !== confirmPassword) {
      setErrorMessage("Password baru dan konfirmasi password tidak cocok!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token: token, 
          new_password: password,
          confirm_new_password: confirmPassword
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        // Otomatis pindah ke halaman login setelah 3 detik
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const responseBody = await response.json();
        let actualError = "Gagal mereset password. Token mungkin tidak valid.";
        if (responseBody.message) {
          actualError = responseBody.message;
        } else if (responseBody.errors) {
          actualError = "Error: " + JSON.stringify(responseBody.errors);
        }
        setErrorMessage(actualError);
      }
    } catch (error) {
      setErrorMessage("Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8F8F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden ${inter.className}`}>
      
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#2C3E50]">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100 sm:rounded-xl sm:px-10 border border-gray-100">
          
          {isSuccess ? (
            // Tampilan Sukses
            <div className="text-center py-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Berhasil Diubah!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Password Anda telah berhasil diperbarui. Anda akan diarahkan ke halaman login dalam beberapa detik...
              </p>
              <Link href="/login">
                <Button className="w-full bg-[#263C92] hover:bg-[#1d2d6e] text-white font-bold rounded-lg h-11">
                  Kembali ke Login Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            // Form Reset Password
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Baru */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-[#2C3E50]">
                  Password Baru
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#263C92] focus:border-[#263C92] sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2C3E50]">
                  Konfirmasi Password
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#263C92] focus:border-[#263C92] sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400 font-normal">
                  Pastikan password baru dan konfirmasi cocok.
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#263C92] hover:bg-[#1d2d6e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#263C92] transition-colors"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}