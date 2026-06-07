import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from "react";
import { removeToken, useCheckToken } from "@/utils/cookie";
import { ProcessedCoursesResult } from "@/interfaces/course";
import { fetchDataAuthenticated, fetchDataAuthenticatedWithBody } from "@/utils/http";
import { useRouter } from "next/navigation";
import { NewUser, User } from "@/interfaces/user";
import { processUserSemesters } from "@/utils/semester";
import { ProcessedUserWithSemesters } from "@/interfaces/semester";
import { DialogHeader, DialogFooter, Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrashIcon, Eye, EyeOff, Key, Power } from "lucide-react"; 
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDanger,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/AppLayout";

export default function Home() {
  const courseTypeNames = {
    0: "K",
    1: "P",
    2: "R",
  };
  useCheckToken();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProcessedUserWithSemesters | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<ProcessedCoursesResult | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [processedUserData, setProcessedUserData] = useState<ProcessedCoursesResult>();
  
  // State Add User
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    initials: "",
    password: "",
    is_admin: false,
  });
  const [email, setEmail] = useState(""); //nambahin state email
  
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [createUserError, setCreateUserError] = useState("");
  const [createUserSuccess, setCreateUserSuccess] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setNewUser({
        name: "",
        initials: "",
        password: "",
        is_admin: false,
      });
      setEmail("");
      setConfirmPassword("");
      setCreateUserError("");
      setCreateUserSuccess("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const logout = () => {
    removeToken();
    router.push("/login");
  }

  const createUser = async () => {
    try {
      if (newUser.initials.length !== 3) {
        throw new Error("Initials must be 3 characters long");
      }

      if (newUser.password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await fetchDataAuthenticatedWithBody(
        "http://localhost:5067/users",
        { 
          method: "POST",
          body: JSON.stringify({
            name: newUser.name,
            initials: newUser.initials,
            password: newUser.password,
            is_admin: newUser.is_admin,
            email: email
          })
        }
      );
      
      if (response && response.data) {
        setUsers(prev => [...prev, {
          id: response.data.id,
          name: response.data.name,
          initials: response.data.initials,
          is_admin: response.data.is_admin,
          is_active: response.data.is_active,
          bkd: 0
        }]);
      }
      
      setCreateUserSuccess("User created successfully");
      setIsDialogOpen(false); 

    } catch (error: any) {
      console.error(error);
      setCreateUserError(error.message);
    }
  };

  const deleteUsers = async (id: number) => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/users/${id}`,
        { method: "DELETE" }
      );
      setUsers(prev => prev.filter(user => user.id !== id));
      if (selectedUserId === id) {
        setSelectedUserId(null);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const payload = {
        is_admin: user.is_admin,
        is_active: !user.is_active
      };
      await fetchDataAuthenticatedWithBody(
        `http://localhost:5067/users/${user.id}`,
        { 
          method: "PUT",
          body: JSON.stringify(payload)
        }
      );
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Gagal mengubah status aktif dosen.");
    }
  };

  const resetPassword = async (id: number) => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/users/reset-password/${id}`,
        { method: "POST" }
      );
      setSuccessMessage("Berhasil! Password telah direset menjadi 'Dosen123!'");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Gagal mereset password.");
    }
  };

  const fetchUserSemesters = async (id: number) => {
    try {
      const response = await fetchDataAuthenticated(
        `http://localhost:5067/users/${id}/semesters`,
        { method: "GET" }
      );
      const user = processUserSemesters(response);
      setSelectedUser(user);
      setSelectedSemester(null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetchDataAuthenticated(
          "http://localhost:5067/users",
          { method: "GET" }
        );
        setUsers(response.data as User[]);
      } catch (error) {
        console.error(error);
      }
    }
    fetchInitialData();
  }, []);

  return (
    <AppLayout 
      role="admin" 
      userName={processedUserData?.name} 
      onLogout={logout}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollArea className="h-[80vh] rounded-md border-0 shadow-md p-4 bg-white">
          <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
            <h2 className="text-xl font-semibold mb-2 text-[#2C3E50]">Users</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <div>
                  <Button className="bg-[#F8F8F8] text-[#343A40]" size="sm" variant="outline">+ Add User</Button>
                </div>
              </DialogTrigger>
                
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-[#2C3E50]">Add user</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="name" className="col-span-2 text-right text-[#2C3E50]">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-5"
                      type="text"
                      value={newUser.name}
                      onChange={(e) => {
                        setNewUser({ ...newUser, name: e.target.value });
                        setCreateUserError("");
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="initials" className="col-span-2 text-right text-[#2C3E50]">
                      Initials
                    </Label>
                    <Input
                      id="initials"
                      name="initials"
                      className="col-span-5"
                      type="text"
                      value={newUser.initials}
                      onChange={(e) => {
                        setNewUser({ ...newUser, initials: e.target.value.toUpperCase() });
                        setCreateUserError("");
                      }}
                    />
                  </div>

                  {/* FORM INPUT EMAIL BARU */}
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="email" className="col-span-2 text-right text-[#2C3E50] text-xs">
                      Email (Ops)
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      className="col-span-5"
                      type="email"
                      placeholder="opsional..."
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setCreateUserError("");
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="password" className="col-span-2 text-right text-[#2C3E50]">
                      Password
                    </Label>
                    <div className="col-span-5 relative">
                        <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        className="pr-10"
                        onChange={(e) => {
                            setNewUser({ ...newUser, password: e.target.value });
                            setCreateUserError("");
                        }}
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="confirmPassword" className="col-span-2 text-right text-[#2C3E50]">
                      Confirm
                    </Label>
                    <div className="col-span-5 relative">
                        <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        className="pr-10"
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setCreateUserError("");
                        }}
                        />
                        <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="is_admin" className="col-span-2 text-right text-[#2C3E50]">
                      Admin
                    </Label>
                    <Input
                      id="is_admin"
                      name="is_admin"
                      className="w-4 h-4"
                      type="checkbox"
                      checked={newUser.is_admin}
                      onChange={(e) => {
                        setNewUser({ ...newUser, is_admin: e.target.checked });
                        setCreateUserError("");
                      }}
                    />
                  </div>
                  
                  {createUserError && (
                    <div className="text-red-600 text-sm text-center">{createUserError}</div>
                  )}
                  {createUserSuccess && (
                    <div className="text-green-600 text-sm text-center">User created successfully</div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={createUser}
                    className="w-full bg-[#4D44B5] hover:bg-[#4D54B5] hover:text-white"
                  >
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {users &&
              users
                .filter(user => !user.is_admin)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(user => (
                  <div key={user.id} className="flex justify-between items-center w-full gap-1">
                    <Button
                      onClick={() => {
                        fetchUserSemesters(user.id);
                        setSelectedUserId(user.id);
                      }}
                      className={`flex-1 text-left p-3 rounded-lg transition-colors flex ${
                        !user.is_active ? "line-through text-gray-400 bg-gray-50" :
                        selectedUserId === user.id
                        ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                        : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                      }`}
                    >
                      <span>{user.name} : BKD {user.bkd}</span>
                    </Button>

                    <div className="flex gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={`p-3 h-auto ${user.is_active ? "text-green-600" : "text-gray-400"}`}
                            title={user.is_active ? "Nonaktifkan Dosen" : "Aktifkan Dosen"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ubah Status Dosen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin {user.is_active ? <strong>menonaktifkan</strong> : <strong>mengaktifkan kembali</strong>} akun <code>{user.name}</code>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleUserStatus(user)} className="bg-[#4D44B5]">
                              Ya, Ubah Status
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="p-3 h-auto text-yellow-600" title="Reset Password">
                            <Key className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ini akan mengembalikan password <code>{user.name}</code> ke sandi bawaan sistem (<strong>Dosen123!</strong>). Aksi ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => resetPassword(user.id)} className="bg-yellow-600 hover:bg-yellow-700">
                              Ya, Reset Password
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="p-3 h-auto"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user <code><strong>{user.name}</strong></code>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogDanger onClick={() => deleteUsers(user.id)}>Delete</AlertDialogDanger>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
          </div>
        </ScrollArea>

        <ScrollArea className="h-[80vh] rounded-md border-0 shadow-md p-4 bg-white">
          {selectedUser ? (
            <>
              <h2 className="text-xl font-semibold border-b border-gray-300 pb-4 mb-4 text-[#2C3E50]">
                Semesters of {selectedUser.initials}
              </h2>
            <div className="grid grid-cols-1 gap-2">
              {selectedUser &&
              selectedUser.semesters &&
              selectedUser.semesters.length > 0 ? (
                selectedUser.semesters.map((semester) => (
                <React.Fragment key={semester.id}>
                  <Button
                  onClick={() => {
                    setSelectedSemester(semester);
                    setSelectedSemesterId(semester.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSemesterId === semester.id
                        ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                        : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                    }`}
                  >
                    {semester.name} : BKD {semester.bkd}
                    </Button>
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-[#525F7F] text-center">No semesters available</p>
                )}
            </div>
            </>
            ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-4 mb-4">
                Semesters
                </h2>
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#525F7F] text-center">Select a user to view semesters</p>
                </div>
              </>
          )}
        </ScrollArea>

        <ScrollArea className="rounded-md border-0 shadow-md p-4 bg-white">
          {selectedUser && selectedSemester ? (
            <>
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-4 mb-4 text-[#2C3E50]">
              {selectedSemester?.name && `Courses ${selectedSemester?.name} of ${selectedUser?.initials}`}
            </h2>
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-1 gap-1">
              {selectedSemester &&
                selectedSemester.courses &&
                selectedSemester.courses
                  .filter(course => course.counts.some(count => count.count > 0))
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((course) => (
                  <div
                    key={course.code}
                    className="bg-[#4D44B5] text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow mb-2"
                  >
                    <div className="font-semibold">{course.code}</div>
                    <div className="text-sm">
                      {course.counts
                        .map((count) => `${courseTypeNames[count.type as keyof typeof courseTypeNames]}: ${count.count}`)
                        .join(", ")}
                    </div>
                  </div>
                ))}
            </div>
            </>
            ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-4 mb-4">
                Courses
                </h2>
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#525F7F] text-center">Select a semester to view courses</p>
                </div>
              </>
          )}
        </ScrollArea>
      </div>

      {/* Pop-up Pesan Sukses */}
      <AlertDialog open={!!successMessage} onOpenChange={(open) => !open && setSuccessMessage(null)}>
        <AlertDialogContent className="bg-white border-green-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 text-xl flex items-center gap-2">
              ✅ Berhasil
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-base mt-2">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              className="bg-[#4D44B5] text-white hover:bg-[#3a338a]" 
              onClick={() => setSuccessMessage(null)}
            >
              Tutup
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}