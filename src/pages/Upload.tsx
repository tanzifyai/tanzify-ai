import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Upload as UploadIcon, FileAudio, Check, Copy, Download, 
  Globe, Loader2, X, FileText, ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { transcribeAudio, TranscriptionResult } from "@/services/transcription";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { useAuth } from "@/contexts/AuthContext";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [language, setLanguage] = useState("auto");
  const [copied, setCopied] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const { addTranscription } = useTranscriptions();
  const { user } = useAuth();

  const getPlanLimit = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 60;
      case 'pro':
        return 150;
      case 'team':
        return 400;
      default:
        return 30; // free
    }
  };

  const checkLimits = useCallback(() => {
    if (user) {
      // Get user's plan limits
      const plan = user.subscription || 'free';
      let limit = 30; // Default free limit

      switch (plan) {
        case 'starter':
          limit = 60;
          break;
        case 'pro':
          limit = 150;
          break;
        case 'team':
          limit = 400;
          break;
        default:
          limit = 30; // free
      }

      const minutesUsed = user.minutes_used || 0;
      if (minutesUsed >= limit) {
        setLimitReached(true);
        setError(`You've used all ${limit} minutes for your ${plan} plan. Upgrade to continue transcribing!`);
        return false;
      } else if (minutesUsed >= limit * 0.8) {
        // Warning at 80% usage
        alert(`Warning: Only ${Math.round(limit - minutesUsed)} minutes left! Consider upgrading for more minutes.`);
      }
    } else {
      // Guest users: 5 minutes per session
      const guestMinutes = parseFloat(localStorage.getItem('guestMinutesUsed') || '0');
      if (guestMinutes >= 5) {
        setLimitReached(true);
        setError("Guest limit reached: 5 minutes per session. Sign up for more!");
        return false;
      }
    }
    return true;
  }, [user]);

  const languages = [
    { code: "auto", name: "Auto-detect" },
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ar", name: "Arabic" },
    { code: "ur", name: "Urdu" },
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/flac'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    return validTypes.some(type => file.type.includes(type.split('/')[1])) || file.size <= maxSize;
  };

  const processFile = useCallback(async () => {
    if (!file) return;

    // Check usage limits before processing
    if (!checkLimits()) return;

    setUploadProgress(0);
    setIsProcessing(false);
    setIsComplete(false);
    setError("");
    setTranscript("");

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            setIsProcessing(true);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Start transcription
      const result: TranscriptionResult = await transcribeAudio(file, language === "auto" ? undefined : language, user?.id);

      clearInterval(uploadInterval);
      setUploadProgress(100);
      setIsProcessing(false);
      setIsComplete(true);
      setTranscript(result.text);

      // Save transcription only for logged-in users
      if (user) {
        await addTranscription({
          filename: file.name,
          text: result.text,
          language: result.language || language,
          duration: result.duration || 0,
          status: 'completed',
        });
      }

      // Update guest minutes used
      if (!user && result.duration) {
        const minutesToAdd = Math.ceil(result.duration / 60);
        const currentGuestMinutes = parseFloat(localStorage.getItem('guestMinutesUsed') || '0');
        localStorage.setItem('guestMinutesUsed', (currentGuestMinutes + minutesToAdd).toString());
      }

      // Celebration logic for logged-in users
      if (user) {
        const transcriptCount = (JSON.parse(localStorage.getItem('transcriptCount') || '0')) + 1;
        localStorage.setItem('transcriptCount', transcriptCount.toString());

        if (transcriptCount === 1) {
          setCelebrationMessage("🎉 Magic! You just saved 45 minutes of typing!\nThat's time for a coffee break ☕ or a short walk 🌳\n\nYou're 20% to becoming a transcription pro! ⚡");
          setShowCelebration(true);
        } else if (transcriptCount === 5) {
          setCelebrationMessage("⭐ Rising Star! You're getting the hang of this!");
          setShowCelebration(true);
        } else if (transcriptCount === 10) {
          setCelebrationMessage("🎊 DECATHLON! 10 transcripts completed! You're amazing!");
          setShowCelebration(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [file, language, user, addTranscription, checkLimits]);

  useEffect(() => {
    if (file && !isProcessing && !isComplete && !error) {
      processFile();
    }
  }, [file, isProcessing, isComplete, error, processFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setUploadProgress(0);
    setIsProcessing(false);
    setIsComplete(false);
    setTranscript("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            ) : (
              <div className="mb-4">
                <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            )}
            <h1 className="font-heading text-3xl font-bold">
              New <span className="gradient-text">Transcription</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload your audio file and get an accurate transcript in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              {/* Language Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Transcription Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Usage Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {user ? `${user.subscription ? user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 'Free'} Minutes Used` : 'Guest Minutes Used'}
                  </span>
                  <span className={`text-sm ${limitReached ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {user ? `${user.minutes_used || 0}/${getPlanLimit(user.subscription || 'free')} min` : `${parseFloat(localStorage.getItem('guestMinutesUsed') || '0').toFixed(1)}/5 min`}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      limitReached ? 'bg-red-500' : user ? 'bg-primary' : 'bg-secondary'
                    }`}
                    style={{
                      width: user
                        ? `${Math.min(((user.minutes_used || 0) / getPlanLimit(user.subscription || 'free')) * 100, 100)}%`
                        : `${Math.min((parseFloat(localStorage.getItem('guestMinutesUsed') || '0') / 5) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                {limitReached && (
                  <div className="mt-2 text-center">
                    <Link to="/pricing">
                      <Button variant="default" size="sm">
                        Upgrade Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Upload Zone */}
              {!file ? (
                <div
                  onDragOver={limitReached ? undefined : handleDragOver}
                  onDragLeave={limitReached ? undefined : handleDragLeave}
                  onDrop={limitReached ? undefined : handleDrop}
                  className={`upload-zone ${limitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isDragging && !limitReached ? 'drag-over' : ''}`}
                >
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={limitReached}
                  />
                  <label htmlFor="file-upload" className={limitReached ? 'cursor-not-allowed' : 'cursor-pointer'}>
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                        <UploadIcon className="w-10 h-10 text-primary" />
                      </div>
                      {limitReached ? (
                        <div className="text-center">
                          <h3 className="font-heading text-xl font-bold mb-2 text-red-500">
                            Usage Limit Reached
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {user ? 'Upgrade to continue transcribing unlimited audio!' : 'Sign up for 30 free minutes!'}
                          </p>
                          <Link to={user ? "/pricing" : "/signup"}>
                            <Button variant="default">
                              {user ? 'Upgrade Now' : 'Sign Up Free'}
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-heading text-xl font-bold mb-2">
                            Drag & Drop Your Audio
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            or click to browse files
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                            <span className="px-2 py-1 bg-muted rounded">MP3</span>
                            <span className="px-2 py-1 bg-muted rounded">WAV</span>
                            <span className="px-2 py-1 bg-muted rounded">M4A</span>
                            <span className="px-2 py-1 bg-muted rounded">FLAC</span>
                            <span className="px-2 py-1 bg-muted rounded">OGG</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-4">
                            Maximum file size: 100MB
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-6">
                  {/* File info */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileAudio className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold truncate max-w-[200px]">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!isComplete && (
                      <Button variant="ghost" size="icon" onClick={handleReset}>
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Progress */}
                  {!isComplete && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isProcessing ? "Processing with AI..." : "Uploading..."}
                        </span>
                        <span className="font-medium">
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            `${Math.min(Math.round(uploadProgress), 100)}%`
                          )}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isProcessing
                              ? "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"
                              : "bg-gradient-to-r from-primary to-secondary"
                          }`}
                          style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Complete state */}
                  {isComplete && (
                    <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Check className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary">Transcription Complete!</p>
                        <p className="text-sm text-muted-foreground">
                          Processed in 2.3 seconds
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features reminder */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="font-heading text-2xl font-bold text-primary">99%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="font-heading text-2xl font-bold text-secondary">50+</p>
                  <p className="text-xs text-muted-foreground">Languages</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="font-heading text-2xl font-bold text-accent">&lt;60s</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
              </div>
            </div>

            {/* Transcript Preview */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Transcript Preview
                </h2>
                {isComplete && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
                    </Button>
                    <Button variant="default" size="sm">
                      <Download className="w-4 h-4" />
                      <span className="ml-1">Download</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className={`min-h-[400px] ${!isComplete ? 'flex items-center justify-center' : ''}`}>
                {!file && (
                  <div className="text-center text-muted-foreground">
                    <FileAudio className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Upload an audio file to see the transcript here</p>
                  </div>
                )}

                {file && !isComplete && (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p>Processing your audio...</p>
                    <p className="text-sm mt-2">This usually takes less than 60 seconds</p>
                  </div>
                )}

                {isComplete && (
                  <div className="space-y-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-muted/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                      {transcript}
                    </pre>

                    {/* Export options */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      {user ? (
                        <>
                          <span className="text-sm text-muted-foreground mr-2">Export as:</span>
                          {["TXT", "SRT", "VTT", "DOCX", "PDF"].map((format) => (
                            <button
                              key={format}
                              className="px-3 py-1 text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                            >
                              {format}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="w-full text-center">
                          <p className="text-sm text-muted-foreground mb-2">Want to download and save your transcripts?</p>
                          <Link to="/signup">
                            <Button variant="default" size="sm">
                              Sign Up Free - Get 30 Minutes!
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-center text-red-500">
                    <p>Error: {error}</p>
                    <Button variant="outline" onClick={processFile} className="mt-4">
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 Congratulations!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-lg whitespace-pre-line">
              {celebrationMessage}
            </div>
            <Button onClick={() => setShowCelebration(false)} className="w-full">
              Continue Transcribing 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;
