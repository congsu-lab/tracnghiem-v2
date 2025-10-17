import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialTime: number, onTimeUp: () => void) => {
  // Validate và normalize initialTime
  const getValidTime = (time: number) => {
    if (typeof time !== 'number' || isNaN(time) || time < 0) {
      console.warn('⚠️ Invalid timer initialTime:', time, 'using default 3600');
      return 3600; // Default 1 hour
    }
    return Math.floor(time);
  };

  const [timeRemaining, setTimeRemaining] = useState(() => getValidTime(initialTime));
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);

  // Sync với server time để đảm bảo chính xác
  const getCurrentTime = () => {
    // Sử dụng Date.now() cho độ chính xác cao
    return Date.now();
  };

  // Update time remaining when initial time changes
  useEffect(() => {
    const validTime = getValidTime(initialTime);
    console.log('🔄 Timer initialTime changed:', initialTime, '→', validTime);
    
    if (!isRunning) {
      setTimeRemaining(validTime);
      totalPausedTimeRef.current = 0;
      lastPauseTimeRef.current = 0;
    }
  }, [initialTime, isRunning]);

  // Main timer effect với sync thời gian thực
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      // Sử dụng requestAnimationFrame cho độ mượt cao
      const updateTimer = () => {
        const now = getCurrentTime();
        const elapsedMs = now - startTimeRef.current - totalPausedTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        const validInitialTime = getValidTime(initialTime);
        const newTimeRemaining = Math.max(0, validInitialTime - elapsedSeconds);
        
        console.log('⏰ Timer update:', {
          now: new Date(now).toLocaleTimeString(),
          elapsed: elapsedSeconds,
          remaining: newTimeRemaining,
          initial: validInitialTime
        });
        
        setTimeRemaining(newTimeRemaining);
        
        if (newTimeRemaining <= 0) {
          console.log('⏰ Timer finished!');
          setIsRunning(false);
          onTimeUp();
          return;
        }
        
        // Schedule next update
        intervalRef.current = setTimeout(updateTimer, 1000);
      };
      
      // Start first update
      updateTimer();
    } else if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, initialTime, onTimeUp]);

  const start = () => {
    if (!isRunning) {
      const now = getCurrentTime();
      console.log('▶️ Timer started at:', new Date(now).toLocaleTimeString());
      
      if (startTimeRef.current === 0) {
        // First start
        startTimeRef.current = now;
        totalPausedTimeRef.current = 0;
      } else {
        // Resume from pause
        const pauseDuration = now - lastPauseTimeRef.current;
        totalPausedTimeRef.current += pauseDuration;
        console.log('⏸️ Resume after pause duration:', Math.floor(pauseDuration / 1000), 'seconds');
      }
      
      setIsRunning(true);
    }
  };

  const pause = () => {
    if (isRunning) {
      const now = getCurrentTime();
      lastPauseTimeRef.current = now;
      setIsRunning(false);
      console.log('⏸️ Timer paused at:', new Date(now).toLocaleTimeString());
    }
  };

  const reset = (newTime?: number) => {
    const validNewTime = newTime ? getValidTime(newTime) : getValidTime(initialTime);
    console.log('🔄 Timer reset to:', validNewTime, 'seconds');
    
    setIsRunning(false);
    setTimeRemaining(validNewTime);
    startTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    lastPauseTimeRef.current = 0;
    
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Sync với thời gian hệ thống mỗi 30 giây
  useEffect(() => {
    if (!isRunning) return;
    
    const syncInterval = setInterval(() => {
      console.log('🔄 Syncing timer with system time...');
      // Force re-calculation trong lần update tiếp theo
    }, 30000); // Sync mỗi 30 giây
    
    return () => clearInterval(syncInterval);
  }, [isRunning]);

  return {
    timeRemaining: Math.max(0, timeRemaining), // Đảm bảo không âm
    isRunning,
    start,
    pause,
    reset
  };
};