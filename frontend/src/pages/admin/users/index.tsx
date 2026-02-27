import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inter } from "next/font/google";
import React, { useEffect, useState } from "react";
import { removeToken, useCheckToken } from "@/utils/cookie";
import { ProcessedCoursesResult } from "@/interfaces/course";
import { fetchDataAuthenticated, fetchDataAuthenticatedWithBody } from "@/utils/http";
import { useRouter } from "next/navigation";
import { NewUser, User } from "@/interfaces/user";
import { processUserSemesters } from "@/utils/semester";
import { ProcessedUserWithSemesters } from "@/interfaces/semester";
import Link from "next/link";
import { DialogHeader, DialogFooter, Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrashIcon, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDanger
} from "@/components/ui/alert-dialog";
const inter = Inter({ subsets: ["latin"] });

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
  const [updatedSchedules, setUpdatedSchedules] = useState({});
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    initials: "",
    password: "",
    is_admin: false,
    is_active: false,
  });
  
  // State Baru untuk Password & Konfirmasi
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [createUserError, setCreateUserError] = useState("");
  const [createUserSuccess, setCreateUserSuccess] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setNewUser({
        name: "",
        initials: "",
        password: "",
        is_admin: false,
        is_active: false,
      });
      setConfirmPassword(""); // Reset konfirmasi password
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

      if (!newUser.is_active) {
        throw new Error("Active option must be selected");
      }

      // Validasi kecocokan password
      if (newUser.password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await fetchDataAuthenticatedWithBody(
        "http://localhost:5067/users",
        { 
          method: "POST",
          body: JSON.stringify(newUser)
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
    <main
      className={`min-h-screen bg-gray-50 p-8 ${inter.className}`} style={{ backgroundColor: '#F3F4FF' }}
    >
      <header className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-bold text-gray-800 text-[#263C92]">Admin Dashboard</h1>
          <Link href="/admin/users" legacyBehavior><Button className="bg-[#F8F8F8] text-[#343A40]" variant="outline">Manage Users</Button></Link>
          <Link href="/admin/semesters" legacyBehavior><Button className="bg-[#F8F8F8] text-[#343A40]" variant="outline">Manage Semesters</Button></Link>
        </div>
        <div className="flex items-center gap-4 text-gray-700">
          <span className="text-lg font-medium">Hi, {processedUserData?.name || "Admin"}!</span>
          <Button onClick={logout} variant="outline" className="wrounded-lg transition-colors bg-[#DD3333] text-white hover:bg-red-200 hover:text-red-800 border border-red-100">
            Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollArea className="h-[80vh] rounded-md border p-4 bg-white">
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
                  
                  {/* Field Password dengan Mata */}
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

                  {/* Field Konfirmasi Password dengan Mata */}
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
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Label htmlFor="is_active" className="col-span-2 text-right text-[#2C3E50]">
                      Active
                    </Label>
                    <Input
                      id="is_active"
                      name="is_active"
                      className="w-4 h-4"
                      type="checkbox"
                      checked={newUser.is_active}
                      onChange={(e) => {
                        setNewUser({ ...newUser, is_active: e.target.checked });
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
                  <div key={user.id} className="flex justify-between items-center w-full">
                    <Button
                      onClick={() => {
                        fetchUserSemesters(user.id);
                        setSelectedUserId(user.id);
                      }}
                      className={`flex-1 text-left p-3 rounded-lg transition-colors flex ${
                        selectedUserId === user.id
                        ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                        : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                      }`}
                    >
                      <span>{user.name} : BKD {user.bkd}</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="ml-2 p-3 h-auto"
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
                ))}
          </div>
        </ScrollArea>

        <ScrollArea className="h-[80vh] rounded-md border p-4 bg-white">
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

        <ScrollArea className="rounded-md border p-4 bg-white">
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
                        .map((count) => `${courseTypeNames[count.type]}: ${count.count}`)
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
    </main>
  );
}