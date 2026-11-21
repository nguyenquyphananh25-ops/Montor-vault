/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Lecturer,
  Student,
  SubjectAttendance,
  StudentDRL,
  MonitorCriterion,
  CongressMetadata,
  ToastMessage
} from './types';
import {
  INITIAL_USER,
  INITIAL_LECTURERS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  generateInitialAttendance,
  INITIAL_DRL_DATA,
  INITIAL_MONITOR_CRITERIA,
  INITIAL_CONGRESS_DATA
} from './data/mockData';
import { generateSampleSignatureDataUrl } from './utils/helpers';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { FacultyDirectory } from './components/FacultyDirectory';
import { ClassRoster } from './components/ClassRoster';
import { SignatureStudio } from './components/SignatureStudio';
import { AdministrativeDocs } from './components/AdministrativeDocs';
import { AttendanceTracker } from './components/AttendanceTracker';
import { DrlGrading } from './components/DrlGrading';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  // 1. Persistent State with LocalStorage
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ulis_monitor_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    const saved = localStorage.getItem('ulis_lecturers');
    return saved ? JSON.parse(saved) : INITIAL_LECTURERS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('ulis_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [subjects, setSubjects] = useState<SubjectAttendance[]>(() => {
    const saved = localStorage.getItem('ulis_subjects');
    if (saved) return JSON.parse(saved);
    // Populate subject 1 with initial attendance
    const initialSubs = [...INITIAL_SUBJECTS];
    initialSubs[0].records = generateInitialAttendance();
    return initialSubs;
  });

  const [savedSignature, setSavedSignature] = useState<string | null>(() => {
    const saved = localStorage.getItem('ulis_signature');
    // Preload sample signature if none yet, to provide instant delight
    return saved !== null ? saved : generateSampleSignatureDataUrl();
  });

  const [criteria, setCriteria] = useState<MonitorCriterion[]>(() => {
    const saved = localStorage.getItem('ulis_criteria');
    return saved ? JSON.parse(saved) : INITIAL_MONITOR_CRITERIA;
  });

  const [congressData, setCongressData] = useState<CongressMetadata>(() => {
    const saved = localStorage.getItem('ulis_congress');
    return saved ? JSON.parse(saved) : INITIAL_CONGRESS_DATA;
  });

  const [drlList, setDrlList] = useState<StudentDRL[]>(() => {
    const saved = localStorage.getItem('ulis_drl_list');
    return saved ? JSON.parse(saved) : INITIAL_DRL_DATA;
  });

  // 2. Navigation & UI state
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'profile'>('login');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ulis_monitor_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ulis_lecturers', JSON.stringify(lecturers));
  }, [lecturers]);

  useEffect(() => {
    localStorage.setItem('ulis_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('ulis_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    if (savedSignature) {
      localStorage.setItem('ulis_signature', savedSignature);
    } else {
      localStorage.removeItem('ulis_signature');
    }
  }, [savedSignature]);

  useEffect(() => {
    localStorage.setItem('ulis_criteria', JSON.stringify(criteria));
  }, [criteria]);

  useEffect(() => {
    localStorage.setItem('ulis_congress', JSON.stringify(congressData));
  }, [congressData]);

  useEffect(() => {
    localStorage.setItem('ulis_drl_list', JSON.stringify(drlList));
  }, [drlList]);

  // Toast dispatch helper
  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3800);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Metrics for overview
  const bannedCount = students.filter((s) => {
    const sub = subjects[0];
    if (!sub || !sub.records) return false;
    const records = sub.records[s.mssv] || {};
    let absentExcused = 0;
    let absentUnexcused = 0;
    let late = 0;
    for (let w = 1; w <= 15; w++) {
      const status = records[w];
      if (status === 'A') absentExcused++;
      else if (status === 'U') absentUnexcused++;
      else if (status === 'L') late++;
    }
    const eq = absentUnexcused + absentExcused * 0.5 + late * 0.33;
    return (eq / 15) * 100 > 20;
  }).length;

  const unsignedDrlCount = drlList.filter((d) => !d.isSigned).length;

  const handleResetData = () => {
    if (confirm('Bạn có chắc muốn đặt lại dữ liệu mẫu của hệ thống ULIS Monitor Hub không?')) {
      localStorage.clear();
      setUser(INITIAL_USER);
      setLecturers(INITIAL_LECTURERS);
      setStudents(INITIAL_STUDENTS);
      const subs = [...INITIAL_SUBJECTS];
      subs[0].records = generateInitialAttendance();
      setSubjects(subs);
      setSavedSignature(generateSampleSignatureDataUrl());
      setCriteria(INITIAL_MONITOR_CRITERIA);
      setCongressData(INITIAL_CONGRESS_DATA);
      setDrlList(INITIAL_DRL_DATA);
      showToast('Đặt lại thành công', 'Dữ liệu mẫu chuẩn ULIS đã được khôi phục', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        user={user}
        hasSignature={!!savedSignature}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSignatureStudio={() => setCurrentTab('signature')}
        onOpenProfile={() => {
          setAuthMode('profile');
          setAuthModalOpen(true);
        }}
        onLogout={() => {
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          hasSignature={!!savedSignature}
          studentsCount={students.length}
          unassignedDrlCount={unsignedDrlCount}
        />

        {/* Right High-Productivity Workspace */}
        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* View Render Router */}
            {currentTab === 'dashboard' && (
              <DashboardOverview
                user={user}
                students={students}
                drlList={drlList}
                hasSignature={!!savedSignature}
                onNavigate={(tab) => setCurrentTab(tab)}
                bannedStudentsCount={bannedCount}
              />
            )}

            {currentTab === 'lecturers' && (
              <FacultyDirectory
                lecturers={lecturers}
                onAddLecturer={(lec) => setLecturers([...lecturers, lec])}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'roster' && (
              <ClassRoster
                students={students}
                className={user.className}
                user={user}
                savedSignature={savedSignature}
                onUpdateStudents={setStudents}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'signature' && (
              <SignatureStudio
                user={user}
                savedSignature={savedSignature}
                onSaveSignature={setSavedSignature}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'documents' && (
              <AdministrativeDocs
                user={user}
                students={students}
                criteria={criteria}
                congressData={congressData}
                savedSignature={savedSignature}
                onUpdateCriteria={setCriteria}
                onUpdateCongress={setCongressData}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceTracker
                students={students}
                subjects={subjects}
                onUpdateSubject={(updated) =>
                  setSubjects(subjects.map((s) => (s.id === updated.id ? updated : s)))
                }
                onAddSubject={(newSub) => setSubjects([...subjects, newSub])}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'drl' && (
              <DrlGrading
                user={user}
                drlList={drlList}
                savedSignature={savedSignature}
                onUpdateDrlList={setDrlList}
                onOpenSignatureStudio={() => setCurrentTab('signature')}
                onShowToast={showToast}
              />
            )}

            {/* Bottom Footer & Reset Helper */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 no-print">
              <div>
                © 2024 - 2025 Trường Đại học Ngoại ngữ - Đại học Quốc gia Hà Nội (ULIS - VNU).
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResetData}
                  className="text-slate-500 hover:text-rose-600 transition-colors underline font-medium"
                >
                  Khôi phục dữ liệu mẫu ban đầu
                </button>
                <span>Hệ Thống Quản Trị Lớp Trưởng v2.5</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Authentication / Profile Modal */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        currentUser={user}
        onClose={() => setAuthModalOpen(false)}
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          showToast('Đăng nhập thành công', `Chào mừng ${loggedInUser.fullName}!`, 'success');
        }}
        onSaveProfile={(updatedUser) => {
          setUser(updatedUser);
          showToast('Cập nhật thành công', 'Hồ sơ Lớp trưởng đã được lưu', 'success');
        }}
      />
    </div>
  );
}
