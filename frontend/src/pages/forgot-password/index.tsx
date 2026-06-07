import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5067/Auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }), 
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setEmail("");
      } else {
        setErrorMessage(data.message || "Gagal mengirim permintaan reset password.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Gagal terhubung ke server. Pastikan backend sudah menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Lupa Password | Dashboard BKD</title>
      </Head>
        <div className={`min-h-screen bg-[#F8F8F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden ${inter.className}`}>        
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4D44B5] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#837AE8] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#263C92]">
            Lupa Password?
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100 sm:rounded-xl sm:px-10 border border-gray-100">
            
            {successMessage ? (
              // Tampilan Jika Sukses Mengirim Email
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cek Email Anda</h3>
                <p className="text-sm text-gray-500 mb-6">{successMessage}</p>
                <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4D44B5] hover:bg-[#3a338a]">
                  Kembali ke Login
                </Link>
              </div>
            ) : (
              // Tampilan Form Input Email
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-[#2C3E50]">
                    Alamat Email
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@apps.ipb.ac.id"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#263C92] focus:border-[#263C92] sm:text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400 font-light">
                    Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset password.
                  </p>
                </div>

                {errorMessage && (
                  <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-md">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#263C92] hover:bg-[#1d2d6e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4D44B5] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Tautan Reset"
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center mt-4">
                  <Link href="/login" className="flex items-center text-sm font-medium text-[#263C92] hover:text-[#1d2d6e] transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Kembali ke Login
                  </Link>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}