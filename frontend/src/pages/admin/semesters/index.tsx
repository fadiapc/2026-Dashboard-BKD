import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inter } from "next/font/google";
import React, { useEffect, useState } from "react";
import { removeToken, useCheckToken } from "@/utils/cookie";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchDataAuthenticated, fetchDataAuthenticatedWithBody } from "@/utils/http";
import { useRouter } from "next/navigation";
import { properSemester } from "@/utils/semester";
import { Semester} from "@/interfaces/semester";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, TrashIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDanger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import BarChartComponent from "@/components/barchart";
import { ProcessedCoursesResult } from "@/interfaces/course";
const inter = Inter({ subsets: ["latin"] });

const SemesterFormSchema = z.object({
  startdate: z.date({
    required_error: "A date is required.",
  }),
})

const CourseFormSchema = z.object({
  code: z.string().max(7, {
    message: "Code must be at most 7 characters.",
  }),
  name: z.string().max(50, {
    message: "Name must be at most 50 characters.",
  }),
  kuliah_credit: z.string(),
  praktikum_credit: z.string(),
  responsi_credit: z.string(),
  kuliah_class_count: z.string(),
  praktikum_class_count: z.string(),
  responsi_class_count: z.string(),
  semesters: z.string()
})

export default function Home() {
  const [processedUserData, setProcessedUserData] = useState<ProcessedCoursesResult>();
  const semesterForm = useForm<z.infer<typeof SemesterFormSchema>>({
    resolver: zodResolver(SemesterFormSchema),
  })

  const courseForm = useForm<z.infer<typeof CourseFormSchema>>({
    resolver: zodResolver(CourseFormSchema),
  })

  function onSubmitSemester(data: z.infer<typeof SemesterFormSchema>) {
    const date = data.startdate.toISOString().slice(0, 10);
    const payload = {
      date,
    };
    const createSemester = async () => {
      try {
        await fetchDataAuthenticatedWithBody(
          "http://localhost:5067/semesters",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        setSemesters((prev) => [...prev, { id: 0, date, is_active: false}]);
        } catch (error) {
          console.error(error);
          }
          };
    createSemester();
  }

  function onSubmitCourse(data: z.infer<typeof CourseFormSchema>) {
    const course_types = [
      {
          type: 0,
          credit: data.kuliah_credit,
          class_count: data.kuliah_class_count
      },
      {
          type: 1,
          credit: data.praktikum_credit,
          class_count: data.praktikum_class_count
      },
      {
          type: 2,
          credit: data.responsi_credit,
          class_count: data.responsi_class_count
      }
  ];
  const filtered_course_types = course_types.filter(course =>
    (course.credit && parseInt(course.credit) > 0) && (course.class_count && parseInt(course.class_count) > 0)
  );
    const payload = {
      semester_id: selectedSemester?.id,
      code: data.code,
      name: data.name,
      course_type: filtered_course_types,
      semesters: data.semesters,
    };
    const createCourse = async () => {
      try {
        const response = await fetchDataAuthenticatedWithBody( //ubah
          "http://localhost:5067/courses",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

      // Perbarui state `selectedSemester` dengan course baru
      const newCourse = await response.data;
      setSelectedSemester((prev) =>
        prev
          ? {
              ...prev,
              courses: [...(prev.courses || []), newCourse],
            }
          : null
      );

        // Reset form setelah berhasil menambahkan course
        courseForm.reset({
          code: "",
          name: "",
          kuliah_credit: "",
          praktikum_credit: "",
          responsi_credit: "",
          kuliah_class_count: "",
          praktikum_class_count: "",
          responsi_class_count: "",
          semesters: ""
        });

        console.log("Course created");
      } catch (error) {
        console.error(error);
      }
    };
    createCourse();
  }


  useCheckToken();
  const router = useRouter();
  
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedSemesterBKD, setSelectedSemesterBKD] = useState([]);

  const logout = () => {
    removeToken();
    router.push("/login");
  }
  
  const setActive = (id: number) => async () => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/semesters/${id}/activate`,
        { method: "PUT" }
      );
      setSemesters((prev) =>
        prev.map((semester) => ({
          ...semester,
          is_active: semester.id === id,
        }))
      );
      setSelectedSemester((prev) => prev && { ...prev, is_active: true });
    } catch (error) {
      console.error(error);
    }
  }

  const deleteSemester = (id: number) => async () => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/semesters/${id}`,
        { method: "DELETE" }
      );
      setSemesters((prev) => prev.filter((semester) => semester.id !== id));
      setSelectedSemester(null);
    } catch (error) {
      console.error(error);
    }
  }

  const deleteCourse = (id: number) => async () => {
    try {
      await fetchDataAuthenticated(
        `http://localhost:5067/courses/${id}`,
        { method: "DELETE" }
      );
      setSelectedSemester((prev) => prev && {
        ...prev,
        courses: prev.courses.filter((course) => course.id !== id),
      });
    } catch (error) {
      console.error(error);
    }
  }

  const fetchSemesters = async (id: number) => {
    try {
      const response = await fetchDataAuthenticated(
        `http://localhost:5067/semesters/${id}`,
        { method: "GET" }
      );
      setSelectedSemester(response.data as Semester);
      const bkdresponse = await fetchDataAuthenticated(
        `http://localhost:5067/users/semesters/${id}`,
        { method: "GET" }
      );
      setSelectedSemesterBKD(bkdresponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetchDataAuthenticated(
          "http://localhost:5067/semesters",
          { method: "GET" }
        );
        setSemesters(response.data as Semester[]);
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

      <div className="grid grid-rows-2 grid-cols-3 w-full gap-5">
        <ScrollArea className="h-[90.5vh] row-span-2 rounded-md border p-4 bg-white">
          <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">Semesters</h4>
          <div className="grid grid-cols-1 gap-2">
          <Form {...semesterForm}>
            <form onSubmit={semesterForm.handleSubmit(onSubmitSemester)} className="space-y-8">
              <div className="flex flex-row items-end gap-2 mb-4">
              <FormField
                control={semesterForm.control}
                name="startdate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[#2C3E50] text-base">Semester start date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[300px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          showOutsideDays={true}
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={2035}
                          className="p-3"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium hidden",
                            caption_dropdowns: "flex gap-2 justify-center",
                            dropdown: "p-1 text-sm border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                          components={{
                            IconLeft: (props) => <ChevronLeft className="h-4 w-4" />,
                            IconRight: (props) => <ChevronRight className="h-4 w-4" />,
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <div className="ml-auto">
                  <Button className="bg-[#4D44B5]" type="submit">+ New Semester</Button>
                </div>
              </div>
            </form>
          </Form>
            {semesters &&
              semesters.sort((a, b) => b.date.localeCompare(a.date))
              .map((semester) => (
                <React.Fragment key={semester.id}>
                  <Button
                    onClick={() => fetchSemesters(semester.id)}
                    variant="outline"
                      className={`w-full text-left p-3 rounded-lg transition-colors flex ${
                        selectedSemester?.id === semester.id
                          ? "bg-[#837AE8] text-white hover:bg-[#837AE8] hover:text-white border"
                          : "bg-white-100 text-[#525F7F] hover:bg-[#EAE8FF] border"
                        } text-base my-1`}
                  >
                    {properSemester(semester.date)}{semester.is_active ? "  ✅" : ""}
                  </Button>
                </React.Fragment>
              ))}
          </div>
        </ScrollArea>
        <ScrollArea className="h-[44vh] rounded-md border p-4 bg-white">
          {selectedSemester ? (
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
              <h4 className="text-xl text-[#2C3E50] font-semibold">
                Courses of {properSemester(selectedSemester.date)}
              </h4>
              {!selectedSemester.is_active && (
                <div>
                  <Button
                    size="sm"
                    onClick={setActive(selectedSemester.id)}
                    variant="outline"
                    className="text-sm my-1 me-1 bg-[#F8F8F8] text-[#343A40]"
                  >
                    Activate
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-[#DD3333]" size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the <code><strong>{properSemester(selectedSemester.date)}</strong></code> semester.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogDanger onClick={deleteSemester(selectedSemester.id)}>Delete</AlertDialogDanger>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            ) : (
                <>
                <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">
                  Courses
                  </h2>
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#525F7F] text-center">Select a semester to view courses</p>
                  </div>
                </>
          )}

          <div className="grid grid-cols-8 gap-2">
            {selectedSemester &&
              selectedSemester.courses &&
              selectedSemester.courses
                .sort((a, b) => a.code.localeCompare(b.code))
                .map(
                  (course) =>
                  <React.Fragment key={course.id}>
                    <div
                      className="my-1 col-span-7 flex justify-between items-start py-2 min-h-[54px] border rounded-md px-3"
                    >
                      <div className="text-base font-medium flex flex-col text-[#2C3E50]">
                        <span>{course.name}</span>
                      </div>
                      <div className="text-base text-right text-[#2C3E50]">
                        <div className="font-medium">{course.code}</div>
                          <div className="text-sm text-muted-foreground text-[#525F7F]"> SKS({
                            course.course_type.find(ct => ct.type === 0)?.credit || 0 }/{
                            course.course_type.find(ct => ct.type === 1)?.credit || 0 }/{
                            course.course_type.find(ct => ct.type === 2)?.credit || 0 })
                          </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                        variant="destructive"
                        className="text-base my-1 min-h-[60.5px]"
                      >
                        <TrashIcon />
                      </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the <code><strong>{course.code} - {course.name}</strong></code> course.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogDanger className="bg-[#DD3333]" onClick={deleteCourse(course.id)}>Delete</AlertDialogDanger>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </React.Fragment>
                )}
          </div>
        </ScrollArea>
        <ScrollArea className="h-[44vh] rounded-md border p-4 bg-white">
          {selectedSemester ? (
            <div>
              <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-2">
                Create a new course for {properSemester(selectedSemester.date)}
              </h4>
              <div className="grid grid-cols-1 gap-2 p-2">
                <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="w-2/3 space-y-6">
                    <FormField
                      control={courseForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Isi kode mata kuliah" {...field}  />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Isi nama mata kuliah" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="kuliah_credit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Kuliah Credit</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="praktikum_credit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Praktikum Credit</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="responsi_credit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Responsi Credit</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="kuliah_class_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Kuliah Class Count</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="praktikum_class_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Praktikum Class Count</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="responsi_class_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Responsi Class Count</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="semesters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-[#2C3E50]">Semesters</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="text-base bg-[#4D44B5]">Submit</Button>
                  </form>
                </Form>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">
                Create a new course
                </h2>
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#525F7F] text-center">Select a semester to create new course</p>
                </div>
              </>
          )}
        </ScrollArea>
        <Card className="h-[44vh] col-span-2 rounded-md border p-4 bg-white">
          {selectedSemester ? (
            <div>
              <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">BKD Graph for {properSemester(selectedSemester.date)}</h4>
              <BarChartComponent data={selectedSemesterBKD.filter(user => !user.is_admin && user.role !== "admin").sort((a, b) => a.name.localeCompare(b.name))} />
            </div>
            ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">
                BKD Graph
                </h2>
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#525F7F] text-center">Select a semester to view BKD graph</p>
                </div>
              </>
          )}
        </Card>
      </div>
    </main>
  );
}
