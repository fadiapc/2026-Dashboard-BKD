import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJWTPayload, setCookies } from "@/utils/cookie";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Eye, EyeOff, ChevronRight } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
  const [initial, setInitial] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('http://localhost:5067/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ initial, password })
      });

      if (response.ok) {
        const responeBody = await response.json();
        setCookies('token', responeBody.data.token);
        
        if (getJWTPayload('role') === 'admin') {
          router.push('/admin/users');
        } else {
          router.push('/');
        }
      } else {
        const responeBody = await response.json();
        setErrorMessage(responeBody.message || 'Login gagal. Periksa kembali Initial dan Password.');
      }
    } catch (error) {
      setErrorMessage('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full h-screen flex items-start ${inter.className}`} style={{ backgroundColor: '#F3F4FF' }}>
      
      {/* SISI KIRI: Foto Gedung (Background) */}
      <div className="relative w-1/2 h-full hidden lg:flex flex-col">
        <img 
          src="/Andi_Hakim_Nasution_building.jpg" 
          className="w-full h-full object-cover" 
          alt="Background Gedung" 
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* SISI KANAN: Form Login */}
      <main className="flex flex-col justify-center p-12 lg:p-24 w-full lg:w-1/2 h-full bg-[#F3F4FF]">
        <div className="w-full max-w-md mx-auto">
          
          {/* Judul Rata Tengah (Center Align) */}
          <div className="mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold text-[#263C92] leading-tight text-center">
              Proyeksi Beban Kerja Pendidikan
            </h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center">
                {errorMessage}
              </div>
            )}

            {/* Input Initial */}
            <div className="space-y-2">
              <h6 className="text-sm font-semibold text-gray-600 ml-1">Initial</h6>
              <Input 
                id="initial" 
                type="text" 
                placeholder="Masukkan Initial"
                required 
                className="h-12 border-gray-300 focus:ring-[#263C92] rounded-lg"
                value={initial} 
                onChange={e => setInitial(e.target.value.toUpperCase())} 
              />
            </div>

            {/* Input Password dengan Toggle Mata */}
            <div className="space-y-2">
              <h6 className="text-sm font-semibold text-gray-600 ml-1">Password</h6>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan Password"
                  required 
                  className="h-12 border-gray-300 focus:ring-[#263C92] rounded-lg pr-12"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Button Masuk */}
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#263C92] hover:bg-[#1d2d6e] text-white font-bold rounded-lg flex items-center justify-center gap-2 group transition-all"
            >
              {isLoading ? "Memproses..." : "Masuk"}
              {!isLoading && (
                <span className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={18} />
                </span>
              )}
            </Button>
          </form>
          
        </div>
      </main>

    </div>
  );
}