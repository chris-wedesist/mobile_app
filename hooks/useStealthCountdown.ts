import { useEffect, useState } from 'react';
import { useStealthMode } from '@/components/StealthModeManager';

type CountdownOptions = {
  initialMinutes?: number;
  onComplete?: () => void;
  autoDeactivate?: boolean;
};

/**
 * Hook to manage a countdown timer for stealth mode
 * 
 * @param options Configuration options
 * @param options.initialMinutes Initial countdown time in minutes
 * @param options.onComplete Callback function to run when countdown reaches zero
 * @param options.autoDeactivate Whether to automatically exit stealth mode when countdown reaches zero
 * 
 * @returns Object containing countdown state and control functions
 */
export function useStealthCountdown({
  initialMinutes = 5,
  onComplete,
  autoDeactivate = false
}: CountdownOptions = {}) {
  const { isActive, deactivate } = useStealthMode();
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Format time values
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentRemaining = (secondsLeft / (initialMinutes * 60)) * 100;

  // Reset countdown when stealth mode is activated
  useEffect(() => {
    if (isActive) {
      setSecondsLeft(initialMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isActive, initialMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || !isRunning || isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          
          if (onComplete) {
            onComplete();
          }
          
          if (autoDeactivate) {
            deactivate('timeout');
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isRunning, isPaused, onComplete, autoDeactivate, deactivate]);

  // Control functions
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);
  const reset = () => setSecondsLeft(initialMinutes * 60);
  const addTime = (additionalMinutes: number) => {
    setSecondsLeft(prev => prev + (additionalMinutes * 60));
  };

  return {
    minutes,
    seconds,
    formattedTime,
    percentRemaining,
    isRunning,
    isPaused,
    pause,
    resume,
    reset,
    addTime
  };
}