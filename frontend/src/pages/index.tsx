import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inter } from "next/font/google";
import React, { useEffect, useState } from "react";
import { getJWTPayload, removeToken, useCheckToken } from "@/utils/cookie";
import {
  Course,
  CourseClass,
  ProcessedCoursesResult,
} from "@/interfaces/course";
import { extractUserData } from "@/utils/user";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchDataAuthenticated, fetchDataAuthenticatedWithBody } from "@/utils/http";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const courseTypeNames = {
    0: "K",
    1: "P",
    2: "R",
  };
  useCheckToken();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourseClass, setSelectedCourseClass] = useState<CourseClass | null>(null);
  const [processedUserData, setProcessedUserData] = useState<ProcessedCoursesResult>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseClassId, setSelectedCourseClassId] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const logout = () => {
    removeToken();
    router.push("/login");
  }

  const changePassword = async () => {
    try {
      if (newPassword !== confirmNewPassword) {
        throw new Error("New password and confirm new password must be the same");
      }
      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      };
      await fetchDataAuthenticatedWithBody(
        "http://localhost:5067/auth/password",
        { 
          method: "PUT",
          body: JSON.stringify(payload),
        }
      )
      setChangePasswordSuccess(true);
    } catch (error) {
      console.error(error);
      setChangePasswordError(error.message);
    }
  }

  const fillSchedule = async (scheduleId: number) => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/schedules/${scheduleId}/fill`, { method: "PUT" }
      );
      if (selectedCourseClassId) {
        await fetchCourseClass(selectedCourseClassId);
      }

      const user = await fetchDataAuthenticated(
        "http://localhost:5067/users/me",
        { method: "GET" }
      );
      setProcessedUserData(extractUserData(user));
    } catch (error) {
      console.error(error);
    }
  };

  const clearSchedule = async (scheduleId: number) => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/schedules/${scheduleId}/clear`, { method: "PUT" }
      );
      if (selectedCourseClassId) {
        await fetchCourseClass(selectedCourseClassId);
      }
      const user = await fetchDataAuthenticated(
        "http://localhost:5067/users/me",
        { method: "GET" }
      );
      setProcessedUserData(extractUserData(user));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourse = async (id: number) => {
    try {
      const response = await fetchDataAuthenticated(
        `http://localhost:5067/courses/${id}`,
        { method: "GET" }
      );
      const course = response.data as Course;
      setSelectedCourse(course);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourseClass = async (id: number) => {
    try {
      const response = await fetchDataAuthenticated(
        `http://localhost:5067/courses/class/${id}`,
        { method: "GET" }
      );
      const courseClass = response.data as CourseClass;
      setSelectedCourseClass(courseClass);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const courses = await fetchDataAuthenticated(
          "http://localhost:5067/courses",
          { method: "GET" }
        );
        const user = await fetchDataAuthenticated(
          "http://localhost:5067/users/me",
          { method: "GET" }
        );
        setIsAdmin(getJWTPayload("role") === "admin");
        setCourses(courses.data);
        setProcessedUserData(extractUserData(user));
      } catch (error) {
        console.error(error);
      }
    }
    fetchInitialData();
  }, []);

  return (
    <main
      className={`flex flex-col items-center justify-between p-6 ${inter.className}`} style={{ backgroundColor: '#F3F4FF' }}
    >
      <header className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4 w-full">
        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-bold text-[#263C92]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 text-gray-700">
          <span className="text-lg">
            Hi, {processedUserData?.name}!
          </span>
          {isAdmin && <Button onClick={() => router.push("/admin")} variant="outline" className="ml-4">Admin Dashboard</Button>}
            <Button onClick={logout} variant="outline" className="wrounded-lg transition-colors bg-[#DD3333] text-white hover:bg-red-200 hover:text-red-800 border border-red-100">
              Logout
            </Button>
        </div>
      </header>

      <div className="grid grid-rows-2 grid-cols-3 w-full gap-5">
        <ScrollArea className="h-[83vh] row-span-2 rounded-md border p-4 bg-white">
          <h4 className="border-b border-gray-300 pb-1 mb-4"><span className="text-xl font-semibold text-[#2C3E50]">Courses</span></h4>
          <div className="grid grid-cols-1 gap-2">
            {courses &&
              courses
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((course) => (
                <React.Fragment key={course.id}>
                  <Button
                    onClick={() => {
                      fetchCourse(course.id);
                      setSelectedCourseId(course.id);
                      setSelectedCourseClass(null);
                      setSelectedCourseClassId(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex justify-start ${
                      selectedCourseId === course.id
                        ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                        : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                    }`}
                  >
                    {course.code} | {course.name}
                  </Button>
                </React.Fragment>
              ))}
          </div>
        </ScrollArea>
        <ScrollArea className="h-[40vh] rounded-md border p-4 bg-white">
            <h4 className="border-b border-gray-300 pb-1 mb-4 text-[#2C3E50]">
              <span className="text-xl font-semibold">
                {selectedCourse ? `Classes of ${selectedCourse.name}` : "Classes"}
              </span>
            </h4>
          <div className="grid grid-cols-4 gap-2">
            {selectedCourse &&
              selectedCourse.course_type ?
              selectedCourse.course_type
                .sort((a, b) => a.type - b.type)
                .map(
                  (type) =>
                    type.course_class &&
                    type.course_class.map((courseClass) => (
                      <React.Fragment key={courseClass.id}>
                        <Button
                          onClick={() => {
                            fetchCourseClass(courseClass.id);
                            setSelectedCourseClassId(courseClass.id);
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedCourseClassId === courseClass.id
                              ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                              : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                          }`}
                        >
                          {courseTypeNames[type.type]}
                          {courseClass.number}
                        </Button>
                      </React.Fragment>
                    ))
                  ) : (
                  <div className="col-span-4 text-center text-[#525F7F]">
                    Select a course to view classes
                  </div>
                )}
          </div>
        </ScrollArea>
        <ScrollArea className="h-[40vh] rounded-md border p-4 bg-white">
          <h4 className="border-b border-gray-300 pb-1 mb-4 text-[#2C3E50]">
            <span className="text-xl font-semibold">Schedule</span>
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {selectedCourseClass &&   
              selectedCourseClass.schedules ?
              selectedCourseClass.schedules.map((schedule) => (
                <React.Fragment key={schedule.id}>
                  {schedule.teacher_initial === processedUserData?.initials ? (
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedScheduleId === schedule.id
                              ? "bg-[#837AE8] text-white hover:bg-[#837AE8]"
                              : "bg-[#837AE8] text-white hover:bg-[#837AE8]"
                          }`}
                        >
                          {schedule.meet_number} | {schedule.teacher_initial}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Button
                          onClick={() => {
                            clearSchedule(schedule.id);
                            setSelectedScheduleId(null);
                          }}
                          className="w-full text-left p-3 rounded-lg transition-colors bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                        >
                          Clear
                        </Button>
                      </PopoverContent>
                    </Popover>
                  ) : schedule.teacher_initial ? (
                    <Button
                      className="w-full text-left p-3 rounded-lg transition-colors bg-red-100 text-red-800 opacity-70"
                      disabled
                    >
                      {schedule.meet_number} | {schedule.teacher_initial}
                    </Button>
                  ) : (
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedScheduleId === schedule.id
                              ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                              : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                          }`}>
                          {schedule.meet_number}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Button
                          onClick={() => {
                            fillSchedule(schedule.id);
                            setSelectedScheduleId(schedule.id);
                          }}
                          className="w-full text-left p-3 rounded-lg transition-colors bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                        >
                          Fill
                        </Button>
                      </PopoverContent>
                    </Popover>
                  )}
                </React.Fragment>
              ))
            : (
              <div className="col-span-3 text-center text-[#525F7F]">
                Select a class to view the schedule
              </div>
            )}
          </div>
        </ScrollArea>
        <Card className="h-[40vh] rounded-md border p-4 bg-white">
          <h4 className="border-b border-gray-300 pb-1 mb-4"><span className="text-xl font-semibold text-[#2C3E50]">My Data</span></h4>
          <div className="grid gap-4">
            <div className="text-base text-[#2C3E50]"><span className="font-bold">Name:</span> {processedUserData?.name}</div>
            <div className="text-base text-[#2C3E50]">
              <span className="font-bold">Initials:</span> {processedUserData?.initials}
            </div>
            <div className="text-base text-[#2C3E50]"><span className="font-bold">BKD:</span> {processedUserData?.bkd}</div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={`w-full text-left text-base p-3 rounded-lg transition-colors bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-800 border border-red-100`}
                >
                  Change Password
                </Button>
              </DialogTrigger>
                
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-5 items-center gap-4">
                    <Label htmlFor="old-password" className="col-span-2 text-right">
                      Old Password
                    </Label>
                    <Input
                      id="old-password"
                      name="old_password"
                      className="col-span-3"
                      type="password"
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        setChangePasswordError("");
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-5 items-center gap-4">
                    <Label htmlFor="new-password" className="col-span-2 text-right">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      name="new_password"
                      className="col-span-3"
                      type="password"
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setChangePasswordError("");
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-5 items-center gap-4">
                    <Label htmlFor="confirm-new-password" className="col-span-2 text-right">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-new-password"
                      name="confirm_new_password"
                      className="col-span-3"
                      type="password"
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setChangePasswordError("");
                      }}
                    />
                  </div>
                  {changePasswordError && (
                    <div className="text-red-500">{changePasswordError}</div>
                  )}
                  {changePasswordSuccess && (
                    <div className="text-green-500">Password changed successfully</div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={changePassword}
                    className={`w-full text-left p-3 rounded-lg transition-colors bg-white-100 text-red-800 hover:bg-red-200 border border-red-100`}
                  >
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
        <ScrollArea className="h-[40vh] rounded-md border p-4 bg-white">
          <h4 className="border-b border-gray-300 pb-1 mb-4 text-[#2C3E50]"><span className="text-xl font-semibold">My Course</span></h4>
          <div className="grid gap-4">
            {processedUserData &&
              processedUserData.courses.map((course) => (
                <React.Fragment key={course.code}>
                  <div
                    className="bg-[#4D44B5] text-white rounded-lg p-3 shadow-md transition-shadow mb-2">
                    <div className="font-semibold">{course.code}</div>
                    <div className="text-sm mt-1">
                      {course.counts
                        .map((count) => `${courseTypeNames[count.type]}: ${count.count}`)
                        .join(", ")}
                    </div>
                  </div>
                </React.Fragment>
              ))}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}
