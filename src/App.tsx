/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveView, UserRole, User } from './types';
import { authStore } from './services/store';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProcessSection } from './components/ProcessSection';
import { ScrollStory3D } from './components/ScrollStory3D';
import { BenefitCards } from './components/BenefitCards';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { VerifyView } from './components/VerifyView';
import { StudentPortalView } from './components/StudentPortalView';
import { AdminPortalView } from './components/AdminPortalView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(authStore.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('student');
  const [verifyTargetQuery, setVerifyTargetQuery] = useState<string>('');

  // Proactive Route Guard: Enforce strict role isolation across all state changes
  useEffect(() => {
    if (currentUser && currentUser.role === 'student' && activeView === 'admin') {
      setActiveView('student');
      window.location.hash = 'student';
    } else if (currentUser && currentUser.role === 'admin' && activeView === 'student') {
      setActiveView('admin');
      window.location.hash = 'admin';
    }
  }, [activeView, currentUser]);

  // Subscribe to auth store changes for global route guards
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      const user = authStore.getCurrentUser();
      setCurrentUser(user);

      if (user && user.role === 'student' && (activeView === 'admin' || window.location.hash.includes('admin'))) {
        setActiveView('student');
        window.location.hash = 'student';
      } else if (user && user.role === 'admin' && (activeView === 'student' || window.location.hash.includes('student'))) {
        setActiveView('admin');
        window.location.hash = 'admin';
      }
    });
    return unsubscribe;
  }, [activeView]);

  // Sync hash routing for natural browser back/forward and deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '');
      const [view, queryPart] = fullHash.split('?');

      if (queryPart && queryPart.includes('id=')) {
        const id = new URLSearchParams(queryPart).get('id');
        if (id) {
          setVerifyTargetQuery(id);
        }
      } else if (view === 'verify') {
        // Ensure verify input starts empty if no query is in URL
        setVerifyTargetQuery('');
      }

      if (['home', 'verify', 'student', 'admin'].includes(view)) {
        const user = authStore.getCurrentUser();
        // Route Guard: Students cannot navigate to Admin Portal
        if (view === 'admin' && user && user.role === 'student') {
          setActiveView('student');
          window.location.hash = 'student';
          return;
        }
        // Route Guard: Admins redirected to Admin Portal
        if (view === 'student' && user && user.role === 'admin') {
          setActiveView('admin');
          window.location.hash = 'admin';
          return;
        }

        setActiveView(view as ActiveView);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ActiveView, query?: string) => {
    const user = authStore.getCurrentUser();

    // Route Guard check before navigation
    if (view === 'admin' && user && user.role === 'student') {
      setActiveView('student');
      window.location.hash = 'student';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'student' && user && user.role === 'admin') {
      setActiveView('admin');
      window.location.hash = 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'verify') {
      if (query) {
        setVerifyTargetQuery(query);
        window.location.hash = `verify?id=${encodeURIComponent(query)}`;
      } else {
        // Strictly empty input when opening verify without a query
        setVerifyTargetQuery('');
        window.location.hash = 'verify';
      }
    } else {
      window.location.hash = view === 'home' ? '' : view;
    }

    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (role: UserRole = 'student') => {
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Minimal Navigation */}
      <Navbar
        activeView={activeView}
        onNavigate={(view) => navigateTo(view)}
        onOpenAuth={(role) => handleOpenAuth(role || 'student')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            {/* 2. Hero Section with 3D canvas and live trust indicator */}
            <HeroSection
              onExploreVerification={() => navigateTo('verify')}
              onGetStarted={() => {
                if (currentUser) {
                  navigateTo(currentUser.role === 'admin' ? 'admin' : 'student');
                } else {
                  handleOpenAuth('student');
                }
              }}
            />

            {/* 3. Four-Step Process (Issue, Secure, Share, Verify) matching design reference */}
            <ProcessSection />

            {/* 4. Scroll-Driven 3D Section (Issue, Hash, Anchor, Verify) */}
            <ScrollStory3D />

            {/* 5. Three Benefit Cards with fade-in reveal */}
            <BenefitCards />

            {/* 5. Final Call-to-Action */}
            <FinalCTA
              onVerify={() => navigateTo('verify')}
              onStudentPortal={() => {
                if (currentUser && currentUser.role === 'admin') {
                  navigateTo('admin');
                } else {
                  navigateTo('student');
                }
              }}
            />
          </>
        )}

        {/* Dedicated Operational Views */}
        {activeView === 'verify' && (
          <VerifyView
            initialQuery={verifyTargetQuery}
            onBackToHome={() => navigateTo('home')}
          />
        )}

        {activeView === 'student' && (
          <StudentPortalView
            onBackToHome={() => navigateTo('home')}
            onOpenAuth={() => handleOpenAuth('student')}
            onNavigateToVerify={(id) => navigateTo('verify', id)}
            onNavigateToAdminPortal={() => navigateTo('admin')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPortalView
            onBackToHome={() => navigateTo('home')}
            onOpenAuth={() => handleOpenAuth('admin')}
            onNavigateToVerify={(id) => navigateTo('verify', id)}
            onNavigateToStudentPortal={() => navigateTo('student')}
          />
        )}
      </main>

      {/* 6. Minimal Footer */}
      <Footer onNavigate={(view) => navigateTo(view)} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={authInitialRole}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(role) => {
          navigateTo(role);
        }}
      />
    </div>
  );
}
