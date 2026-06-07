import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, TrashIcon } from "lucide-react";
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
import { CourseSelect } from "@/components/CourseSelect"; 

// === IMPORT KOMPONEN BARU
import { AppLayout } from "@/components/AppLayout";

const SemesterFormSchema = z.object({
  startdate: z.date({ required_error: "Start date is required." }),
  enddate: z.date({ required_error: "End date is required." }),
})

const CourseFormSchema = z.object({
  code: z.string().max(7, { message: "Code must be at most 7 characters." }),
  name: z.string().max(50, { message: "Name must be at most 50 characters." }),
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCourseDropdown, setSelectedCourseDropdown] = useState<any>(null);

  const semesterForm = useForm<z.infer<typeof SemesterFormSchema>>({
    resolver: zodResolver(SemesterFormSchema),
  })

  const courseForm = useForm<z.infer<typeof CourseFormSchema>>({
    resolver: zodResolver(CourseFormSchema),
    defaultValues: {
        code: "", name: "", kuliah_credit: "", praktikum_credit: "",
        responsi_credit: "", kuliah_class_count: "", praktikum_class_count: "",
        responsi_class_count: "", semesters: ""
    }
  })

  const watchKuliahCredit = courseForm.watch("kuliah_credit");
  const watchPraktikumCredit = courseForm.watch("praktikum_credit");
  const watchResponsiCredit = courseForm.watch("responsi_credit");

  useEffect(() => {
    if (!watchKuliahCredit || parseInt(watchKuliahCredit) <= 0) courseForm.setValue("kuliah_class_count", "0");
    if (!watchPraktikumCredit || parseInt(watchPraktikumCredit) <= 0) courseForm.setValue("praktikum_class_count", "0");
    if (!watchResponsiCredit || parseInt(watchResponsiCredit) <= 0) courseForm.setValue("responsi_class_count", "0");
  }, [watchKuliahCredit, watchPraktikumCredit, watchResponsiCredit, courseForm]);

  function onSubmitSemester(data: z.infer<typeof SemesterFormSchema>) {
    const payload = {
      date: data.startdate.toISOString().slice(0, 10),
      endDate: data.enddate.toISOString().slice(0, 10),
    };
    const createSemester = async () => {
      try {
        const response = await fetchDataAuthenticatedWithBody("http://localhost:5067/semesters", {
          method: "POST", body: JSON.stringify(payload),
        });
        setSemesters((prev) => [...prev, response.data]);
        semesterForm.reset(); 
      } catch (error: any) {
        setErrorMessage(error.message || "Terjadi kesalahan saat menyimpan semester"); 
      }
    };
    createSemester();
  }

  function onSubmitCourse(data: z.infer<typeof CourseFormSchema>) {
    if (!data.code || !data.name) {
       setErrorMessage("Silakan pilih atau ketik Mata Kuliah dari dropdown terlebih dahulu.");
       return;
    }

    const course_types = [
      { type: 0, credit: data.kuliah_credit ? parseInt(data.kuliah_credit) : 0, class_count: data.kuliah_class_count ? parseInt(data.kuliah_class_count) : 0 },
      { type: 1, credit: data.praktikum_credit ? parseInt(data.praktikum_credit) : 0, class_count: data.praktikum_class_count ? parseInt(data.praktikum_class_count) : 0 },
      { type: 2, credit: data.responsi_credit ? parseInt(data.responsi_credit) : 0, class_count: data.responsi_class_count ? parseInt(data.responsi_class_count) : 0 }
    ];
    const filtered_course_types = course_types.filter(course => course.credit > 0 && course.class_count > 0);

    const payload = {
      semester_id: selectedSemester?.id,
      code: data.code,
      name: data.name,
      course_type: filtered_course_types,
      semesters: data.semesters ? parseInt(data.semesters) : 0,
    };

    const createCourse = async () => {
      try {
        const response = await fetchDataAuthenticatedWithBody("http://localhost:5067/courses", {
          method: "POST", body: JSON.stringify(payload),
        });
        const newCourse = await response.data;
        setSelectedSemester((prev) => prev ? { ...prev, courses: [...(prev.courses || []), newCourse] } : null);
        courseForm.reset();
        setSelectedCourseDropdown(null);
      } catch (error: any) {
        setErrorMessage(error.message || "Terjadi kesalahan saat menyimpan mata kuliah.");
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
      await fetchDataAuthenticated(`http://localhost:5067/semesters/${id}/activate`, { method: "PUT" });
      setSemesters((prev) => prev.map((semester) => ({ ...semester, is_active: semester.id === id })));
      setSelectedSemester((prev) => prev && { ...prev, is_active: true });
    } catch (error) { console.error(error); }
  }

  const deleteSemester = (id: number) => async () => {
    try {
      await fetchDataAuthenticated(`http://localhost:5067/semesters/${id}`, { method: "DELETE" });
      setSemesters((prev) => prev.filter((semester) => semester.id !== id));
      setSelectedSemester(null);
    } catch (error) { console.error(error); }
  }

  const deleteCourse = (id: number) => async () => {
    try {
      await fetchDataAuthenticated(`http://localhost:5067/courses/${id}`, { method: "DELETE" });
      setSelectedSemester((prev) => prev && { ...prev, courses: prev.courses.filter((course) => course.id !== id) });
    } catch (error) { console.error(error); }
  }

  const fetchSemesters = async (id: number) => {
    try {
      const response = await fetchDataAuthenticated(`http://localhost:5067/semesters/${id}`, { method: "GET" });
      setSelectedSemester(response.data as Semester);
      const bkdresponse = await fetchDataAuthenticated(`http://localhost:5067/users/semesters/${id}`, { method: "GET" });
      setSelectedSemesterBKD(bkdresponse.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetchDataAuthenticated("http://localhost:5067/semesters", { method: "GET" });
        setSemesters(response.data as Semester[]);
      } catch (error) { console.error(error); }
    }
    fetchInitialData();
  }, []);

  return (

    <AppLayout 
      role="admin" 
      userName={processedUserData?.name} 
      onLogout={logout}
    >
      <div className="grid grid-rows-2 grid-cols-3 w-full gap-5">
        <ScrollArea className="h-[90.5vh] row-span-2 rounded-md border-0 shadow-md p-4 bg-white">
          <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">Semesters</h4>
          <div className="grid grid-cols-1 gap-2">
          <Form {...semesterForm}>
            <form onSubmit={semesterForm.handleSubmit(onSubmitSemester)} className="space-y-4 mb-6">
              <div className="flex flex-row items-start gap-4">
                {/* Input Tanggal Mulai */}
                <FormField
                  control={semesterForm.control}
                  name="startdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[#2C3E50] text-base">Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-[200px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick start date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Input Tanggal Selesai */}
                <FormField
                  control={semesterForm.control}
                  name="enddate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[#2C3E50] text-base">End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-[200px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick end date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button className="bg-[#4D44B5] w-full mt-2" type="submit">+ New Semester</Button>
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
                    {semester.name}{semester.is_active ? "  ✅" : ""}
                  </Button>
                </React.Fragment>
              ))}
          </div>
        </ScrollArea>
        <ScrollArea className="h-[44vh] rounded-md border-0 shadow-md p-4 bg-white">
          {selectedSemester ? (
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
              <h4 className="text-xl text-[#2C3E50] font-semibold">
                Courses of {selectedSemester.name}
              </h4>
              {!selectedSemester.is_active && (
                <div>
                  <Button size="sm" onClick={setActive(selectedSemester.id)} variant="outline" className="text-sm my-1 me-1 bg-[#F8F8F8] text-[#343A40]">Activate</Button>
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
                <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">Courses</h2>
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#525F7F] text-center">Select a semester to view courses</p>
                  </div>
                </>
          )}

          <div className="grid grid-cols-8 gap-2">
            {selectedSemester && selectedSemester.courses && selectedSemester.courses
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((course) =>
                  <React.Fragment key={course.id}>
                    <div className="my-1 col-span-7 flex justify-between items-start py-2 min-h-[54px] border rounded-md px-3">
                      <div className="text-base font-medium flex flex-col text-[#2C3E50]">
                        <span>{course.name}</span>
                      </div>
                      <div className="text-base text-right text-[#2C3E50]">
                        <div className="font-medium">{course.code}</div>
                          <div className="text-sm text-muted-foreground text-[#525F7F]"> SKS({
                            course.course_type?.find(ct => ct.type === 0)?.credit || 0 }/{
                            course.course_type?.find(ct => ct.type === 1)?.credit || 0 }/{
                            course.course_type?.find(ct => ct.type === 2)?.credit || 0 })
                          </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="text-base my-1 min-h-[60.5px]"><TrashIcon /></Button>
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
        <ScrollArea className="h-[44vh] rounded-md border-0 shadow-md p-4 bg-white">
          {selectedSemester ? (
            <div>
              <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-2">
                Create a new course for {properSemester(selectedSemester.date)}
              </h4>
              <div className="grid grid-cols-1 gap-2 p-2">
                <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="w-full md:w-5/6 space-y-6">
                    <div className="space-y-2">
                      <FormLabel className="text-base font-bold text-[#263C92]">Pilih / Tambah Mata Kuliah</FormLabel>
                      <CourseSelect 
                         value={selectedCourseDropdown}
                         onChange={(data) => {
                            setSelectedCourseDropdown(data);
                            if (data) {
                               courseForm.setValue("name", data.originalName || data.label);
                               if (!data.isNew) courseForm.setValue("code", data.value);
                               else courseForm.setValue("code", ""); 
                            } else {
                               courseForm.setValue("name", ""); courseForm.setValue("code", "");
                            }
                         }}
                      />
                    </div>

                    <FormField
                      control={courseForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: KOM101" {...field} disabled={selectedCourseDropdown && !selectedCourseDropdown.isNew} />
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
                            <Input placeholder="Nama mata kuliah" {...field} disabled={selectedCourseDropdown && !selectedCourseDropdown.isNew} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={courseForm.control} name="kuliah_credit" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">SKS Kuliah</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={courseForm.control} name="praktikum_credit" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">SKS Praktikum</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={courseForm.control} name="responsi_credit" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">SKS Responsi</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" onWheel={(e) => e.currentTarget.blur()}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={courseForm.control} name="kuliah_class_count" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">Kelas Kuliah</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" disabled={!watchKuliahCredit || parseInt(watchKuliahCredit) <= 0} className={(!watchKuliahCredit || parseInt(watchKuliahCredit) <= 0) ? "bg-gray-100" : ""}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={courseForm.control} name="praktikum_class_count" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">Kelas Praktikum</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" disabled={!watchPraktikumCredit || parseInt(watchPraktikumCredit) <= 0} className={(!watchPraktikumCredit || parseInt(watchPraktikumCredit) <= 0) ? "bg-gray-100" : ""}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={courseForm.control} name="responsi_class_count" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-[#2C3E50]">Kelas Responsi</FormLabel>
                            <FormControl><Input placeholder="0" {...field} type="number" min="0" disabled={!watchResponsiCredit || parseInt(watchResponsiCredit) <= 0} className={(!watchResponsiCredit || parseInt(watchResponsiCredit) <= 0) ? "bg-gray-100" : ""}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField control={courseForm.control} name="semesters" render={({ field }) => (
                        <FormItem><FormLabel className="text-base text-[#2C3E50]">Semesters</FormLabel>
                          <FormControl><Input placeholder="Contoh: 1, 2... 14" {...field} type="number" min="1" max="14" onWheel={(e) => e.currentTarget.blur()}/>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                    />
                    <Button type="submit" className="text-base bg-[#4D44B5] w-full">Save Course</Button>
                  </form>
                </Form>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">Create a new course</h2>
              <div className="flex items-center justify-center h-full"><p className="text-[#525F7F] text-center">Select a semester to create new course</p></div>
            </>
          )}
        </ScrollArea>
        <Card className="h-[44vh] col-span-2 rounded-md border-0 shadow-md p-4 bg-white">
          {selectedSemester ? (
            <div>
              <h4 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">BKD Graph for {properSemester(selectedSemester.date)}</h4>
              <BarChartComponent data={selectedSemesterBKD.filter(user => !user.is_admin && user.role !== "admin").sort((a, b) => a.name.localeCompare(b.name))} />
            </div>
            ) : (
            <>
              <h2 className="text-xl text-[#2C3E50] font-semibold border-b border-gray-300 pb-2 mb-4">BKD Graph</h2>
              <div className="flex items-center justify-center h-full"><p className="text-[#525F7F] text-center">Select a semester to view BKD graph</p></div>
            </>
          )}
        </Card>
      </div>

      <AlertDialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <AlertDialogContent className="bg-white border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 text-xl flex items-center gap-2">⚠️ Peringatan</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-base mt-2">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button className="bg-[#4D44B5] text-white hover:bg-[#3a338a]" onClick={() => setErrorMessage(null)}>Mengerti</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}