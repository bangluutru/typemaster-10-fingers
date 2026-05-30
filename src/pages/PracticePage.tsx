import React, { useEffect } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { lessons } from '../data/lessons';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { LessonText } from '../components/LessonText';
import { VirtualKeyboard } from '../components/Keyboard/VirtualKeyboard';
import { HandGuide } from '../components/HandGuide/HandGuide';
import { StatsPanel } from '../components/StatsPanel';
import type { AppSettings } from '../stores/settingsStore';

interface PracticePageProps {
  lessonId: string;
  settings: AppSettings;
  onNavigate: (page: any) => void;
  onLessonComplete: (wpm: number, accuracy: number, timeSpent: number, errors: Record<string, number>) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({
  lessonId,
  settings,
  onNavigate,
  onLessonComplete,
}) => {
  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];

  const {
    currentIndex,
    charStatuses,
    elapsedTime,
    wpm,
    accuracy,
    isCompleted,
    errorStats,
    lastPressedKey,
    lastPressedCorrect,
    resetKeyFlash,
  } = useTypingEngine({
    text: lesson.text,
    soundEnabled: settings.soundEnabled,
    backspaceEnabled: settings.backspaceEnabled,
    active: true,
  });

  useEffect(() => {
    if (isCompleted) {
      onLessonComplete(wpm, accuracy, elapsedTime, errorStats);
      onNavigate('result');
    }
  }, [isCompleted, wpm, accuracy, elapsedTime, errorStats, onLessonComplete, onNavigate]);

  const targetChar = lesson.text[currentIndex] || '';

  useEffect(() => {
    if (lastPressedKey) {
      const t = setTimeout(() => {
        resetKeyFlash();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [lastPressedKey, resetKeyFlash]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-4xl py-2 px-4 select-none">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => onNavigate('lessons')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại lộ trình</span>
        </button>

        <div className="text-center flex flex-col">
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest leading-none">
            {lesson.levelName}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            {lesson.name}
          </h2>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Luyện lại từ đầu</span>
        </button>
      </div>

      <StatsPanel
        wpm={wpm}
        accuracy={accuracy}
        errorCount={Object.values(errorStats).reduce((a, b) => a + b, 0)}
        elapsedTime={elapsedTime}
        currentIndex={currentIndex}
        totalLength={lesson.text.length}
      />

      <LessonText
        text={lesson.text}
        currentIndex={currentIndex}
        charStatuses={charStatuses}
        fontSize={settings.fontSize}
        lastPressedCorrect={lastPressedCorrect}
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {settings.handsEnabled && (
          <div className="lg:col-span-2 w-full">
            <HandGuide targetChar={targetChar} />
          </div>
        )}

        <div className={settings.handsEnabled ? 'lg:col-span-3 w-full' : 'lg:col-span-5 w-full'}>
          <VirtualKeyboard
            targetChar={targetChar}
            lastPressedKey={lastPressedKey}
            lastPressedCorrect={lastPressedCorrect}
          />
        </div>
      </div>
    </div>
  );
};
export default PracticePage;
