import { Course, ProcessedCoursesResult } from "./course";

export interface Semester {
  id: number;
  name: string;
  date: string;
  end_date: string;
  is_active: boolean;
  courses?: any[];
}

export interface SemesterOfUser {
    id: number;
    date: string;
    is_active: boolean;
    bkd: number;
    courses?: Course[];
}


export interface ProcessedUserWithSemesters {
    id: number;
    name: string;
    initials: string;
    is_admin: boolean;
    is_active: boolean;
    semesters?: ProcessedCoursesResult[];
}
