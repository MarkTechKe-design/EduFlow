export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string | null;
    school_id: number | null;
    status: string;
    last_login_at: string | null;
    roles?: Array<{ id?: number; name: string } | string>;
}

export interface School {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    timezone: string;
    currency: string;
    language: string;
    status: 'active' | 'inactive' | 'suspended';
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface AcademicYear {
    id: number;
    school_id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    school: School | null;
    flash: {
        success?: string;
        error?: string;
    };
    faviconUrl: string | null;
    errors: Record<string, string>;
    [key: string]: any;
};

export interface Guardian {
    id: number;
    school_id: number;
    user_id?: number | null;
    name: string;
    relation?: string | null;
    phone?: string | null;
    email?: string | null;
    occupation?: string | null;
    address?: string | null;
    photo?: string | null;
    created_at?: string;
    [key: string]: any;
}

export interface StudentDocument {
    id: number;
    student_id: number;
    title: string;
    file_path: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
}

export interface Student {
    id: number;
    school_id: number;
    class_id: number;
    section_id: number | null;
    guardian_id: number | null;
    admission_no: string;
    admission_number?: string;
    roll_no: string | null;
    first_name: string;
    middle_name?: string | null;
    last_name: string | null;
    full_name: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth: string | null;
    dob?: string | null;
    birth_certificate_no?: string | null;
    nemis_upi?: string | null;
    assessment_no?: string | null;
    blood_group: string | null;
    religion: string | null;
    nationality: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    photo: string | null;
    photo_url: string | null;
    category: 'general' | 'disabled' | 'quota';
    status: 'active' | 'alumni' | 'transferred' | 'inactive';
    admission_date: string | null;
    admission_type?: string | null;
    previous_school: string | null;
    guardian_name?: string | null;
    guardian_relation?: string | null;
    guardian_phone?: string | null;
    emergency_contact?: string | null;
    medical_info?: string | null;
    created_at: string;
    school_class?: SchoolClass;
    class?: SchoolClass | { id?: number; name: string };
    enrollments?: StudentEnrollment[];
    section?: Section;
    guardian?: Guardian;
    documents?: StudentDocument[];
    student_guardians?: StudentGuardian[];
    medical_profile?: any;
    [key: string]: any;
}

export interface SchoolClass {
    id: number;
    school_id: number;
    name: string;
    numeric_name: number | null;
    capacity: number;
    class_teacher_id: number | null;
    sections_count?: number;
    subjects_count?: number;
    sections?: Section[];
    subjects?: Subject[];
}

export interface Section {
    id: number;
    school_id: number;
    class_id: number;
    name: string;
    capacity: number;
    school_class?: SchoolClass;
    enrollments?: StudentEnrollment[];
}

export interface Subject {
    id: number;
    school_id: number;
    class_id: number;
    name: string;
    code: string | null;
    type: 'theory' | 'practical';
    full_marks: number;
    pass_marks: number;
    school_class?: SchoolClass;
    enrollments?: StudentEnrollment[];
}

export interface Shift {
    id: number;
    school_id: number;
    name: string;
    start_time: string;
    end_time: string;
}

export interface Holiday {
    id: number;
    school_id: number;
    name: string;
    date: string;
    description: string | null;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Timetable {
    id: number;
    school_id: number;
    class_id: number;
    section_id: number | null;
    subject_id: number;
    teacher_id: number | null;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null;
    subject?: Subject;
    teacher?: Staff;
    school_class?: SchoolClass;
    enrollments?: StudentEnrollment[];
    section?: Section;
}

export interface TimeSlot {
    start: string;
    end: string;
}

export interface Attendance {
    id: number;
    school_id: number;
    date: string;
    attendable_type: string;
    attendable_id: number;
    status: 'present' | 'absent' | 'late' | 'half_day';
    remarks: string | null;
}

export interface Department {
    id: number;
    school_id: number;
    name: string;
    code: string | null;
    description: string | null;
    staff_count?: number;
}

export interface Designation {
    id: number;
    school_id: number;
    department_id: number | null;
    name: string;
    description: string | null;
    staff_count?: number;
    department?: Department;
}

export interface StaffDocument {
    id: number;
    staff_id: number;
    title: string;
    file_path: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
}

export interface Staff {
    id: number;
    school_id: number;
    user_id: number | null;
    department_id: number | null;
    designation_id: number | null;
    emp_id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string | null;
    full_name: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth: string | null;
    blood_group: string | null;
    religion: string | null;
    nationality: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    photo: string | null;
    photo_url: string | null;
    joining_date: string | null;
    salary_type: 'fixed' | 'hourly';
    salary: string | null;
    status: 'active' | 'resigned' | 'terminated' | 'on_leave';
    notes: string | null;
    created_at: string;
    department?: Department;
    designation?: Designation;
    documents?: StaffDocument[];
}

export type PaginatedResponse<T> = {
    data: T[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
};

export interface StudentEnrollment {
    id: number;
    school_id: number;
    student_id: number;
    academic_year_id?: number | null;
    academic_year: string;
    term: string;
    class_id: number;
    section_id?: number | null;
    roll_no?: string | null;
    status: 'active' | 'promoted' | 'repeated' | 'transferred_out' | 'completed';
    start_date?: string | null;
    end_date?: string | null;
    remarks?: string | null;
    created_at?: string;
    updated_at?: string;
    school_class?: SchoolClass;
    enrollments?: StudentEnrollment[];
    section?: Section;
    academic_year_relation?: AcademicYear;
}

// Guardian defined above

export interface StudentGuardian {
    id: number;
    school_id: number;
    student_id: number;
    guardian_id: number;
    relationship_type: string;
    is_primary: boolean;
    has_legal_custody: boolean;
    receives_sms_notifications: boolean;
    receives_report_cards: boolean;
    emergency_priority: number;
    guardian?: Guardian;
}

export interface StudentMedicalProfile {
    id: number;
    school_id: number;
    student_id: number;
    blood_group?: string | null;
    allergies?: string | null;
    chronic_conditions?: string | null;
    emergency_medication?: string | null;
    dietary_restrictions?: string | null;
    sha_nhif_no?: string | null;
    preferred_hospital?: string | null;
    doctor_name?: string | null;
    doctor_phone?: string | null;
    special_instructions?: string | null;
    created_at?: string;
    updated_at?: string;
}

export type PerformanceLevel = 'EE' | 'ME' | 'AE' | 'BE';

export interface AssessmentStrand {
    id: number;
    school_id: number;
    cbc_assessment_id: number;
    strand_name: string;
    sub_strand?: string | null;
    specific_learning_outcome?: string | null;
    sort_order: number;
    created_at?: string;
}

export interface AssessmentScore {
    id: number;
    school_id: number;
    cbc_assessment_id: number;
    assessment_strand_id: number;
    student_id: number;
    performance_level: PerformanceLevel;
    numeric_score: number;
    teacher_comments?: string | null;
    student?: Student;
    strand?: AssessmentStrand;
}

export interface CbcAssessment {
    id: number;
    school_id: number;
    academic_year_id: number;
    term: string;
    class_id: number;
    section_id?: number | null;
    subject_id: number;
    title: string;
    type: 'formative_task' | 'summative_term' | 'project_work' | 'knec_cba';
    assessment_date: string;
    description?: string | null;
    status: string;
    created_by?: number | null;
    created_at?: string;
    academic_year?: AcademicYear;
    school_class?: SchoolClass;
    section?: Section;
    subject?: {
        id: number;
        name: string;
        code?: string | null;
    };
    strands?: AssessmentStrand[];
    strands_count?: number;
    scores_count?: number;
}


export interface PaginatedData<T = any> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}