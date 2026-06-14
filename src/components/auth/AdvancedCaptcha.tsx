import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, ShieldCheck, ShieldAlert, Lock, Clock } from 'lucide-react';

interface AdvancedCaptchaProps {
  onVerified: (verified: boolean) => void;
}

type ChallengeType = 'math' | 'text';

const LOCKOUT_KEY = 'captcha_lockout';
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in ms
const MAX_ATTEMPTS = 3;

export default function AdvancedCaptcha({ onVerified }: AdvancedCaptchaProps) {
  const [challengeType, setChallengeType] = useState<ChallengeType>('text');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [num3, setNum3] = useState(0);
  const [operator1, setOperator1] = useState<'+' | '-' | '×'>('+');
  const [operator2, setOperator2] = useState<'+' | '-' | '×'>('+');
  const [textChallenge, setTextChallenge] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check lockout status on mount and periodically
  useEffect(() => {
    const checkLockout = () => {
      const lockoutData = localStorage.getItem(LOCKOUT_KEY);
      if (lockoutData) {
        const lockoutTime = parseInt(lockoutData, 10);
        const now = Date.now();
        const remaining = lockoutTime - now;
        
        if (remaining > 0) {
          setIsLockedOut(true);
          setLockoutRemaining(Math.ceil(remaining / 1000));
          onVerified(false);
        } else {
          localStorage.removeItem(LOCKOUT_KEY);
          setIsLockedOut(false);
          setLockoutRemaining(0);
          setAttempts(0);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [onVerified]);

  // Generate distorted text with mix of uppercase, lowercase, and numbers
  const generateDistortedText = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars[Math.floor(Math.random() * chars.length)];
    }
    return text;
  }, []);

  // Draw captcha text on canvas with heavy distortion
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add aggressive noise lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 80 + 30}, ${Math.random() * 120 + 80}, ${Math.random() * 100 + 150}, 0.35)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 80 + 30}, ${Math.random() * 120 + 80}, ${Math.random() * 100 + 150}, 0.35)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw text with heavy distortion
    const baseSize = 26;
    ctx.textBaseline = 'middle';

    text.split('').forEach((char, i) => {
      const fontSize = baseSize + (Math.random() * 8 - 4);
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      
      const x = 18 + i * 38;
      const y = canvas.height / 2 + (Math.random() * 16 - 8);
      const rotation = (Math.random() * 40 - 20) * Math.PI / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.transform(1, Math.random() * 0.3 - 0.15, Math.random() * 0.3 - 0.15, 1, 0, 0);

      const colors = ['#1e40af', '#1d4ed8', '#0369a1', '#0c4a6e', '#1e3a8a'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Add overlay noise
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 80 + 30}, ${Math.random() * 120 + 80}, ${Math.random() * 100 + 150}, 0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.lineTo(canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  }, []);

  const generateChallenge = useCallback(() => {
    if (isLockedOut) return;

    const types: ChallengeType[] = ['math', 'text'];
    const type = types[Math.floor(Math.random() * types.length)];
    setChallengeType(type);

    if (type === 'math') {
      const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
      const op1 = operators[Math.floor(Math.random() * operators.length)];
      const op2 = operators[Math.floor(Math.random() * operators.length)];
      
      let n1, n2, n3;
      
      if (op1 === '×' || op2 === '×') {
        n1 = Math.floor(Math.random() * 6) + 2;
        n2 = Math.floor(Math.random() * 5) + 1;
        n3 = Math.floor(Math.random() * 5) + 1;
      } else {
        n1 = Math.floor(Math.random() * 15) + 5;
        n2 = Math.floor(Math.random() * 10) + 1;
        n3 = Math.floor(Math.random() * 8) + 1;
      }
      
      if (op1 === '-' && n2 > n1) {
        [n1, n2] = [n2, n1];
      }

      setNum1(n1);
      setNum2(n2);
      setNum3(n3);
      setOperator1(op1);
      setOperator2(op2);
    } else {
      const text = generateDistortedText();
      setTextChallenge(text);
      setTimeout(() => drawCaptcha(text), 50);
    }

    setUserAnswer('');
    setIsVerified(false);
    setShowError(false);
    onVerified(false);
  }, [isLockedOut, onVerified, generateDistortedText, drawCaptcha]);

  useEffect(() => {
    if (!isLockedOut) {
      generateChallenge();
    }
  }, [isLockedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (challengeType === 'text' && textChallenge && !isLockedOut) {
      drawCaptcha(textChallenge);
    }
  }, [challengeType, textChallenge, drawCaptcha, isLockedOut]);

  const getCorrectAnswer = (): string => {
    if (challengeType === 'math') {
      let result1: number;
      switch (operator1) {
        case '+': result1 = num1 + num2; break;
        case '-': result1 = num1 - num2; break;
        case '×': result1 = num1 * num2; break;
        default: result1 = 0;
      }
      
      let finalResult: number;
      switch (operator2) {
        case '+': finalResult = result1 + num3; break;
        case '-': finalResult = result1 - num3; break;
        case '×': finalResult = result1 * num3; break;
        default: finalResult = 0;
      }
      
      return String(finalResult);
    } else {
      return textChallenge;
    }
  };

  const triggerLockout = () => {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
    setIsLockedOut(true);
    setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
  };

  const handleVerify = () => {
    if (isLockedOut) return;

    const correct = getCorrectAnswer();
    const userInput = userAnswer.trim();
    
    const isCorrect = challengeType === 'text' 
      ? userInput === correct 
      : userInput === correct;
    
    if (isCorrect) {
      setIsVerified(true);
      setShowError(false);
      setAttempts(0);
      onVerified(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShowError(true);
      setIsVerified(false);
      onVerified(false);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        triggerLockout();
      } else {
        // Generate new challenge after failed attempt
        setTimeout(() => {
          generateChallenge();
        }, 500);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer && !isVerified && !isLockedOut) {
      handleVerify();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show lockout screen
  if (isLockedOut) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
        <Label className="text-red-700 text-sm flex items-center gap-2">
          <Lock className="h-4 w-4" />
          🔒 تم قفل التحقق الأمني مؤقتاً
        </Label>
        
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="p-4 rounded-full bg-red-100 border border-red-200">
            <Clock className="h-8 w-8 text-red-600 animate-pulse" />
          </div>
          <p className="text-slate-700 text-center">
            تم تجاوز الحد الأقصى للمحاولات ({MAX_ATTEMPTS} محاولات)
          </p>
          <p className="text-2xl font-mono text-red-600">
            {formatTime(lockoutRemaining)}
          </p>
          <p className="text-xs text-slate-500 text-center">
            يرجى الانتظار حتى انتهاء فترة القفل
          </p>
        </div>
      </div>
    );
  }

  const renderChallenge = () => {
    switch (challengeType) {
      case 'math':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-white border border-blue-100 text-slate-800 text-lg font-mono shadow-sm">
              <span className="text-xl">({num1}</span>
              <span className="text-blue-600 text-xl font-bold">{operator1}</span>
              <span className="text-xl">{num2})</span>
              <span className="text-blue-600 text-xl font-bold">{operator2}</span>
              <span className="text-xl">{num3}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-400">?</span>
            </div>
            <p className="text-xs text-slate-500">احسب من اليسار لليمين</p>
          </div>
        );
      case 'text':
        return (
          <div className="flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              width={250}
              height={70}
              className="rounded-xl border border-blue-200"
            />
            <p className="text-xs text-slate-500">أدخل الحروف والأرقام كما تظهر (حساس لحالة الأحرف)</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white/70 border border-blue-100 shadow-sm space-y-3">
      <Label className="text-slate-700 text-sm flex items-center gap-2 justify-between">
        <span className="flex items-center gap-2">
          {isVerified ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          )}
          🔐 التحقق الأمني - أثبت أنك إنسان
        </span>
        {attempts > 0 && !isVerified && (
          <span className="text-xs text-amber-600">
            ({MAX_ATTEMPTS - attempts} محاولات متبقية)
          </span>
        )}
      </Label>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {renderChallenge()}
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
          title="تحديث السؤال"
          disabled={isVerified}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {showError && (
        <p className="text-xs text-red-600 text-center animate-pulse">
          ❌ إجابة خاطئة - سيتم تغيير السؤال تلقائياً
        </p>
      )}

      <div className="flex gap-2">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            setShowError(false);
          }}
          onKeyPress={handleKeyPress}
          placeholder={challengeType === 'math' ? 'الإجابة' : 'أدخل النص'}
          className="flex-1 h-11 rounded-xl bg-white border-blue-200 text-slate-800 placeholder:text-slate-400 text-center font-mono focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
          dir="ltr"
          disabled={isVerified}
          autoComplete="off"
        />
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer || isVerified}
          className={`min-w-[100px] h-11 rounded-xl text-white shadow-sm ${isVerified ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isVerified ? (
            <>
              <ShieldCheck className="h-4 w-4 ml-1" />
              تم ✓
            </>
          ) : (
            'تحقق'
          )}
        </Button>
      </div>

      {isVerified && (
        <p className="text-xs text-emerald-600 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          ✓ تم التحقق بنجاح - أنت إنسان
        </p>
      )}
    </div>
  );
}
