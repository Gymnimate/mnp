import React, { useState, useEffect, useRef, useId } from "react";
import { 
  Volume2, 
  VolumeX, 
  Scale, 
  MessageSquare, 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Check, 
  X, 
  Menu,
  GraduationCap, 
  Briefcase, 
  Globe, 
  Home, 
  Heart, 
  Eye,
  EyeOff,
  AlertTriangle,
  Send,
  Clock,
  MessageCircle,
  Trash2,
  PenTool,
  Bookmark,
  Lock,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit, serverTimestamp, deleteDoc } from "firebase/firestore";
import { 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { db, auth } from "./firebase";

// --- PROCEDURAL AUDIO SYNTHESIZER FOR IMMERSIVE SOUND design ---
class ProceduralSynthesizer {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = false;

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    
    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    // Ambient Slow Tension Drone (52 Hz - sub level pulse)
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = "sine";
    this.droneOsc.frequency.setValueAtTime(52, this.ctx.currentTime);
    
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    
    this.droneOsc.start();
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.2);
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
    }
  }

  public getEnabled() {
    return this.isEnabled;
  }

  // Resonant high-quality physical bell chime structure
  public playChime(pitch: number = 523.25) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // Main chime root
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 2.0);

    // High fifth harmonic sparkle
    const sparkOsc = this.ctx.createOscillator();
    const sparkGain = this.ctx.createGain();
    sparkOsc.type = "sine";
    sparkOsc.frequency.setValueAtTime(pitch * 1.5, now);
    
    sparkGain.gain.setValueAtTime(0, now);
    sparkGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    
    sparkOsc.connect(sparkGain);
    sparkGain.connect(this.masterGain);
    
    sparkOsc.start(now);
    sparkOsc.stop(now + 1.0);
  }

  // Tension release sound slide
  public playHumSlide(fromPitch: number = 100, toPitch: number = 52) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(fromPitch, now);
    osc.frequency.exponentialRampToValueAtTime(toPitch, now + 0.8);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.0);
  }
}

const audioSynth = new ProceduralSynthesizer();

// --- ANIMATION CONFIGS FOR FRAMER MOTION ---
const fuaParent = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const fuaItem = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const fuaItemScale = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

// --- HOOK FOR TRIGGERING STAT COUNTER UP ON VIEW ---
function useIntersectionObserver(ref: React.RefObject<Element | null>) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return isIntersecting;
}

// Stats Counter Component
function CounterUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useIntersectionObserver(ref);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const increment = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-5xl md:text-6xl font-serif font-black text-accent-red tracking-tight">
      {count}
      <span className="text-accent-gold text-3xl font-sans ml-1">{suffix}</span>
    </div>
  );
}

// Accordion Item Component using smooth Framer Motion height transition
function AccordionItem({ 
  title, 
  content, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  content: string; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  const headerId = useId();
  const bodyId = useId();

  return (
    <div className="border border-white/5 hover:border-accent-red/20 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
      <button
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
        className="w-full flex justify-between items-center p-6 text-left font-medium text-lg text-text-light hover:bg-white/[0.02] transition-colors focus:outline-none focus:ring-1 focus:ring-accent-red/30"
      >
        <span>{title}</span>
        <span 
          className={`text-2xl text-accent-red transition-transform duration-300 transform ${isOpen ? "rotate-45" : "rotate-0"}`}
        >
          <Plus className="w-5 h-5 animate-pulse" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={bodyId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-6 text-text-muted leading-relaxed text-sm md:text-base bg-white/[0.005]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- DYNAMIC INTERACTIVE 3D SPACE BACKGROUND ---
function SpaceBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic changing background space structures
    const starCount = 150;
    const stars: { x: number; y: number; z: number; size: number; baseColor: string; speedMult: number }[] = [];
    const colors = ["#ffffff", "#ea384c", "#fcc97c", "#9252f5", "#4fa0d0"];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1600,
        z: Math.random() * 1000 + 40,
        size: Math.random() * 1.6 + 0.4,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        speedMult: Math.random() * 0.4 + 0.8
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.25;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.25;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.0015;
      
      // Interpolate mouse coordinates for organic fluid responsiveness
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Dark space backdrop
      ctx.fillStyle = "rgba(7, 7, 10, 0.5)";
      ctx.fillRect(0, 0, width, height);

      // Perspective variables
      const fov = 350;
      const centerX = width / 2 + mouseX * 0.6;
      const centerY = height / 2 + mouseY * 0.6;

      // Dynamic rotation angle around depth axis for continuous 3D rotation
      const driftAngle = time * 0.12;
      const cosAngle = Math.cos(driftAngle);
      const sinAngle = Math.sin(driftAngle);

      stars.forEach((star) => {
        // Star speed travels depthwards
        star.z -= 0.5 * star.speedMult;

        // Reset if we pass the viewport limits
        if (star.z <= 0) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * 1600;
          star.y = (Math.random() - 0.5) * 1600;
          star.speedMult = Math.random() * 0.4 + 0.8;
        }

        // Apply a slow, organic 3D rotational shift to coordinates for beautiful changing trails
        const rx = star.x * cosAngle - star.y * sinAngle;
        const ry = star.x * sinAngle + star.y * cosAngle;

        // Project onto 2D viewport
        const px = (rx * fov) / star.z + centerX;
        const py = (ry * fov) / star.z + centerY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = star.size * (fov / star.z) * 1.5;
          let opacity = (1000 - star.z) / 1000;
          
          if (star.z < 100) {
            opacity *= (star.z / 100); // Fade out close arrivals
          }

          // Twinkle effect (sine frequency shift based on birth layout)
          const twinkle = Math.abs(Math.sin(time * 12 + star.x * 0.01));
          ctx.globalAlpha = Math.max(0, Math.min(1, opacity * (0.4 + twinkle * 0.6)));
          
          ctx.fillStyle = star.baseColor;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.3, Math.min(size, 4.5)), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1] bg-[#07070a]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// --- FIRESTORE ROOT UTILITIES FOR DEEP SECURITY AND INTERACTIONS ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Highly descriptive relative Czech time-stamp parser
function formatCzechDate(timestamp: any) {
  if (!timestamp) return "právě teď";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "právě teď";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "právě teď";
    if (diffMins < 60) return `před ${diffMins} min.`;
    if (diffHours < 24) {
      if (diffHours === 1) return "před hodinou";
      if (diffHours < 5) return `před ${diffHours} hodinami`;
      return `před ${diffHours} hod.`;
    }
    
    return date.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (err) {
    console.error("Error formatting date:", err);
    return "právě teď";
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"tišina" | "strach" | "spolecenstvi">("tišina");
  const [pollChoice, setPollChoice] = useState<"silence" | "voice" | null>(null);
  const [pollVotes, setPollVotes] = useState<{ silence: number, voice: number }>({ silence: 0, voice: 0 });
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero-id");

  // Discussion Interactive State Definitions
  const [opinions, setOpinions] = useState<any[]>([]);
  const [opinionText, setOpinionText] = useState("");
  const [isSubmittingOpinion, setIsSubmittingOpinion] = useState(false);
  const [opinionError, setOpinionError] = useState("");
  const [opinionSuccess, setOpinionSuccess] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Set up Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Authentication Overlay States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const resetAuthForm = () => {
    setLoginEmail("");
    setLoginPassword("");
    setLoginName("");
    setLoginError("");
    setLoginSuccess("");
    setIsRegistering(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    setIsSubmittingAuth(true);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Prosím vyplňte všechna pole.");
      setIsSubmittingAuth(false);
      return;
    }

    try {
      if (isRegistering) {
        if (loginPassword.length < 6) {
          throw new Error("Heslo musí mít alespoň 6 znaků.");
        }
        await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        setLoginSuccess("Účet byl úspěšně vytvořen! Vítejte.");
        if (audioEnabled) {
          audioSynth.playChime(659.25);
        }
        setTimeout(() => {
          setShowLoginModal(false);
          resetAuthForm();
        }, 1500);
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        setLoginSuccess("Úspěšně přihlášeno.");
        if (audioEnabled) {
          audioSynth.playChime(523.25);
        }
        setTimeout(() => {
          setShowLoginModal(false);
          resetAuthForm();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = "Při autentizaci došlo k chybě.";
      if (err.code === "auth/email-already-in-use") {
        localizedError = "Tento e-mail již používá jiný účet.";
      } else if (err.code === "auth/invalid-email" || err.message?.includes("invalid-email")) {
        localizedError = "Neplatný formát e-mailové adresy.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        localizedError = "Nesprávný e-mail nebo heslo.";
      } else if (err.message) {
        localizedError = err.message;
      }
      setLoginError(localizedError);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOpinionError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account"
      });
      await signInWithPopup(auth, provider);
      if (audioEnabled) {
        audioSynth.playChime(523.25); // C5 chime sound
      }
    } catch (err: any) {
      console.error(err);
      setOpinionError("Přihlášení přes Google selhalo. Zkuste to prosím znovu.");
    }
  };

  const handleAnonymousSignIn = async () => {
    setOpinionError("");
    try {
      await signInAnonymously(auth);
      if (audioEnabled) {
        audioSynth.playChime(523.25); // C5 chime sound
      }
    } catch (err: any) {
      console.error(err);
      setOpinionError("Anonymní přihlášení selhalo. Zkuste to prosím znovu.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (audioEnabled) {
        audioSynth.playChime(392.00); // G4 chime sound
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Firestore Snapshot real-time query channel
  useEffect(() => {
    const q = query(
      collection(db, "opinions"),
      orderBy("createdAt", "desc"),
      limit(40)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const temp: any[] = [];
        snapshot.forEach((docSnap) => {
          temp.push({ id: docSnap.id, ...docSnap.data() });
        });
        setOpinions(temp);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "opinions");
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync saved poll choice from local storage
  useEffect(() => {
    const saved = localStorage.getItem("dilemma_vote_choice");
    if (saved === "silence" || saved === "voice") {
      setPollChoice(saved);
    }
  }, []);

  // Listen to live dilemma survey statistics
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "votes"),
      (snapshot) => {
        let silenceCount = 0;
        let voiceCount = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.choice === "silence") {
            silenceCount++;
          } else if (data.choice === "voice") {
            voiceCount++;
          }
        });
        setPollVotes({ silence: silenceCount, voice: voiceCount });
      },
      (error) => {
        console.error("Failed to sync dilemma survey stats from database:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Streamlined inline auth action with Google flow to instantly post opinions
  const handleOpinionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionText.trim()) return;
    
    setIsSubmittingOpinion(true);
    setOpinionError("");
    setOpinionSuccess(false);

    try {
      let currentUser = user;
      if (!currentUser) {
        setShowLoginModal(true);
        setIsSubmittingOpinion(false);
        return;
      }

      if (!currentUser) {
        throw new Error("Přihlášení selhalo");
      }

      // Secure unique id generation and validation mapping
      const customDocRef = doc(collection(db, "opinions"));
      await setDoc(customDocRef, {
        text: opinionText.trim(),
        authorName: "Anonym",
        category: "opinion",
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Play soft sound tone feedback on successful submission if audio is active
      if (audioEnabled) {
        audioSynth.playChime(659.25); // Golden chime tone E5
      }

      setOpinionText("");
      setOpinionSuccess(true);
      setCommentsPage(1);
      setTimeout(() => setOpinionSuccess(false), 5500);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setOpinionError("Přihlašovací okno bylo zavřeno.");
      } else {
        setOpinionError("Nepodařilo se odeslat příspěvek. Zkuste to prosím znovu.");
      }
    } finally {
      setIsSubmittingOpinion(false);
    }
  };

  // Delete opinion helper callback
  const handleOpinionDelete = async (opinionId: string) => {
    try {
      if (!user) return;
      await deleteDoc(doc(db, "opinions", opinionId));
      if (audioEnabled) {
        audioSynth.playHumSlide(240, 100);
      }
    } catch (err: any) {
      console.error("Failed to delete opinion:", err);
    }
  };

  // Particles generator
  const [particles] = useState(() => 
    Array.from({ length: 25 }, () => ({
      left: Math.random() * 100,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 8,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.2,
      color: ["#e63946", "#f4a261", "#7b2cbf", "#457b9d", "#ffffff"][Math.floor(Math.random() * 5)]
    }))
  );

  // Scrollspy & Progress Bar Tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(progress);
      setScrolled(window.scrollY > 40);

      // Active section highlight (scrollspy)
      const sections = ["hero-id", "intro", "dilema", "historie", "dnes", "akce", "faq", "diskuze"];
      const scrollPosition = window.scrollY + 250;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track cursor movement on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleToggleAccordion = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
    if (audioEnabled) {
      audioSynth.playChime(329.63); // Bell chime E4
    }
  };

  const handleAudioToggle = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    audioSynth.setEnabled(nextState);
    if (nextState) {
      audioSynth.playChime(523.25); // Trigger a crisp physical bell click on play
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    if (audioEnabled) {
      audioSynth.playChime(587.33); // D5 anchor sound
    }
  };

  const handleTabChange = (tab: "tišina" | "strach" | "spolecenstvi") => {
    setActiveTab(tab);
    if (audioEnabled) {
      if (tab === "tišina") {
        audioSynth.playHumSlide(240, 52);
      } else if (tab === "strach") {
        audioSynth.playHumSlide(150, 100);
      } else {
        audioSynth.playChime(659.25); // high E5 bell for spolecenstvi
      }
    }
  };

  const handlePollVote = async (choice: "silence" | "voice") => {
    // If they click the already active button, we still want to play audio feedback for a tactile feel
    const isNewVote = pollChoice !== choice;
    const oldChoice = pollChoice;
    
    setPollChoice(choice);
    localStorage.setItem("dilemma_vote_choice", choice);

    if (audioEnabled) {
      if (choice === "silence") {
        audioSynth.playHumSlide(300, 70);
      } else {
        audioSynth.playChime(783.99); // G5 crystal ring sound
      }
    }

    if (isNewVote) {
      // Optimistic state updates so numbers change instantly on screen!
      setPollVotes((prev) => {
        const next = { ...prev };
        if (oldChoice === "silence") next.silence = Math.max(0, next.silence - 1);
        if (oldChoice === "voice") next.voice = Math.max(0, next.voice - 1);

        if (choice === "silence") next.silence += 1;
        if (choice === "voice") next.voice += 1;
        return next;
      });

      try {
        const customVoteRef = doc(collection(db, "votes"));
        await setDoc(customVoteRef, {
          choice: choice,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        console.error("Failed to cast anonymous vote in Firestore:", err);
      }
    }
  };

  const commentsPerPage = 4;
  const totalCommentsPages = Math.max(1, Math.ceil(opinions.length / commentsPerPage));
  const activeCommentsPage = Math.min(commentsPage, totalCommentsPages);
  const startIndex = (activeCommentsPage - 1) * commentsPerPage;
  const paginatedOpinions = opinions.slice(startIndex, startIndex + commentsPerPage);

  return (
    <div className="relative min-h-screen bg-bg-dark text-text-light selection:bg-accent-red/30 selection:text-white pb-0" id="root-container">
      {/* Dynamic changing 3D cosmic background */}
      <SpaceBackground3D />

      {/* GPU Accelerated CSS Nebulae */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-11] select-none">
        <div className="absolute top-[15%] left-[5%] w-[65vw] h-[65vw] rounded-full bg-accent-purple/5 blur-[120px] animate-breathe-slow mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[5%] w-[70vw] h-[70vw] rounded-full bg-accent-gold/4 blur-[130px] animate-breathe-slow-delay mix-blend-screen" />
        <div className="absolute top-[40%] right-[20%] w-[60vw] h-[60vw] rounded-full bg-accent-red/4 blur-[140px] animate-breathe-slow mix-blend-screen" />
      </div>

      {/* Background Noise overlay for premium paper texture */}
      <div className="noise-overlay" id="noise-overlay-id" />

      {/* Subtle mouse glow trail (shows on desktop) */}
      <div 
        id="cursorGlow-id"
        className="hidden md:block cursor-glow"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
        }}
      />

      {/* Scroll Progress Indicator Bar */}
      <div 
        id="scrollProgress-id"
        className="scroll-progress" 
        style={{ width: `${scrollProgress}%` }} 
      />

      {/* --- REDESIGNED FLOATING GLASS CAPSULE NAVIGATION --- */}
      <nav 
        id="navbar-id"
        className={`nav ${scrolled ? "scrolled" : ""}`}
      >
        <div className="nav-capsule">
          <a 
            href="#hero-id" 
            onClick={(e) => handleLinkClick(e, "hero-id")} 
            className="nav-logo hover:text-accent-red flex items-center gap-2 relative group"
          >
            <Volume2 className="w-4 h-4 text-accent-red animate-pulse" />
            <span className="bg-gradient-to-r from-text-light via-text-muted to-text-light bg-clip-text text-transparent">
              Mlčet, nebo promluvit?
            </span>
          </a>

          {/* Desktop Navigation Links (with scrollspy highlight) */}
          <ul className="nav-links hidden md:flex">
            <li>
              <a 
                href="#intro" 
                onClick={(e) => handleLinkClick(e, "intro")}
                className={activeSection === "intro" ? "active" : ""}
              >
                Úvod
              </a>
            </li>
            <li>
              <a 
                href="#dilema" 
                onClick={(e) => handleLinkClick(e, "dilema")}
                className={activeSection === "dilema" ? "active" : ""}
              >
                Dilema
              </a>
            </li>
            <li>
              <a 
                href="#historie" 
                onClick={(e) => handleLinkClick(e, "historie")}
                className={activeSection === "historie" ? "active" : ""}
              >
                Historie
              </a>
            </li>
            <li>
              <a 
                href="#dnes" 
                onClick={(e) => handleLinkClick(e, "dnes")}
                className={activeSection === "dnes" ? "active" : ""}
              >
                Svět
              </a>
            </li>
            <li>
              <a 
                href="#akce" 
                onClick={(e) => handleLinkClick(e, "akce")}
                className={activeSection === "akce" ? "active" : ""}
              >
                Kroky
              </a>
            </li>
            <li>
              <a 
                href="#faq" 
                onClick={(e) => handleLinkClick(e, "faq")}
                className={activeSection === "faq" ? "active" : ""}
              >
                FAQ
              </a>
            </li>
            <li>
              <a 
                href="#diskuze" 
                onClick={(e) => handleLinkClick(e, "diskuze")}
                className={activeSection === "diskuze" ? "active" : ""}
              >
                Diskuze
              </a>
            </li>
          </ul>

          {/* Controls Right Section (Hamburger toggle and Auth) */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "Profil"} 
                    className="w-7 h-7 rounded-full border border-accent-gold/40 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-[10px] font-bold text-accent-gold">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-semibold text-text-light max-w-[120px] truncate">
                  {user.displayName || "Uživatel"}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Odhlásit se"
                  className="px-2.5 py-1.5 md:px-3 md:py-1.5 bg-white/[0.02] border border-white/5 hover:border-accent-red/30 hover:bg-accent-red/10 rounded-full text-xs font-semibold text-text-muted hover:text-accent-red transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  <span className="hidden md:inline">Odhlásit</span>
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={() => {
                  setShowLoginModal(true);
                  if (audioEnabled) {
                    audioSynth.playChime(587.33); // D5 chime sound on activation
                  }
                }}
                className="relative group overflow-hidden px-4 py-2 bg-gradient-to-r from-accent-red/20 to-[#c1121f]/20 border border-accent-red/50 hover:border-accent-red hover:bg-gradient-to-r hover:from-accent-red hover:to-[#c1121f] hover:text-white rounded-full text-xs font-extrabold tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-accent-red/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2 text-accent-red"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Přihlásit se</span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 bg-white/[0.02] border border-white/5 hover:border-white/15 rounded-xl text-text-light transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Animated Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden bg-bg-dark/95 backdrop-blur-xl border-b border-white/5 absolute top-full left-0 w-full"
            >
              <ul className="px-6 py-8 space-y-5 text-center flex flex-col items-center">
                <li>
                  <a 
                    href="#intro" 
                    onClick={(e) => handleLinkClick(e, "intro")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "intro" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Úvod
                  </a>
                </li>
                <li>
                  <a 
                    href="#dilema" 
                    onClick={(e) => handleLinkClick(e, "dilema")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "dilema" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Dilema
                  </a>
                </li>
                <li>
                  <a 
                    href="#historie" 
                    onClick={(e) => handleLinkClick(e, "historie")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "historie" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Historie
                  </a>
                </li>
                <li>
                  <a 
                    href="#dnes" 
                    onClick={(e) => handleLinkClick(e, "dnes")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "dnes" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Moderní svět
                  </a>
                </li>
                <li>
                  <a 
                    href="#akce" 
                    onClick={(e) => handleLinkClick(e, "akce")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "akce" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Kroky
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => handleLinkClick(e, "faq")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "faq" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a 
                    href="#diskuze" 
                    onClick={(e) => handleLinkClick(e, "diskuze")} 
                    className={`block text-sm uppercase tracking-widest font-bold ${activeSection === "diskuze" ? "text-accent-red" : "text-text-muted"}`}
                  >
                    Diskuze
                  </a>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION WITH STUNNING ENTRANCES --- */}
      <section id="hero-id" className="hero min-h-screen flex items-center justify-center relative overflow-hidden px-4 md:px-8">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-red/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-purple/5 blur-[150px] pointer-events-none" />

        {/* Floating background graphical letters */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[12%] left-[6%] text-9xl text-white/5 font-serif select-none animate-float-1">🤫</div>
          <div className="absolute bottom-[22%] right-[6%] text-8xl text-white/5 font-serif select-none animate-float-2">📢</div>
          <div className="absolute top-[65%] left-[28%] text-7xl text-white/5 font-serif select-none animate-float-3">⚖️</div>
        </div>

        {/* Rising particle vectors */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" id="particles-wrapper">
          {particles.map((p, idx) => (
            <div
              key={idx}
              className="absolute rounded-full transition-all duration-1000"
              style={{
                left: `${p.left}%`,
                bottom: "-20px",
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.opacity,
                animation: `particleFloat ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Hero main contents */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fuaParent}
          className="relative z-10 max-w-4xl text-center space-y-6 md:space-y-8 pointer-events-auto"
        >
          <motion.h1 
            variants={fuaItem}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black tracking-tight leading-none select-none"
          >
            <span className="text-text-muted hover:text-white transition-colors duration-500 relative inline-block group">
              Mlčet
              <span className="absolute bottom-1 left-0 w-full h-[4px] bg-accent-red scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </span>
            ,<br className="sm:hidden" /> nebo <span className="bg-gradient-to-r from-accent-red via-accent-gold to-accent-red bg-[length:200%_auto] bg-clip-text text-transparent italic font-black">promluvit</span>?
          </motion.h1>

          <motion.p 
            variants={fuaItem}
            className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-text-muted font-light leading-relaxed"
          >
            Když mlčíš, dáváš najevo souhlas. Mlčení není neutralita — je to volba. A každá volba má své dalekosáhlé důsledky.
          </motion.p>

          <motion.div variants={fuaItem} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a 
              href="#intro" 
              onClick={(e) => handleLinkClick(e, "intro")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-red to-[#c1121f] hover:from-accent-red hover:to-[#c1121f] text-white rounded-full font-bold tracking-wider text-xs uppercase shadow-lg shadow-accent-red/30 hover:shadow-accent-red/50 hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer"
            >
              Pochopit téma
            </a>
            <a 
              href="#dnes" 
              onClick={(e) => handleLinkClick(e, "dnes")}
              className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-white/30 rounded-full font-bold tracking-wider text-xs uppercase hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer"
            >
              Moderní svět
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* --- INTRO SECTION --- */}
      <section id="intro" className="relative py-24 md:py-36 bg-bg-section/80 border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Prose & Burke Quote */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fuaParent}
                className="space-y-6 text-left"
              >
                <motion.div variants={fuaItem} className="flex items-center gap-3">
                  <span className="w-10 h-[1px] bg-accent-red" />
                  <span className="text-xs uppercase tracking-widest text-accent-red font-bold">Úvod do problematiky</span>
                </motion.div>
                <motion.h2 variants={fuaItem} className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-light leading-tight">
                  Co znamená mlčet a co znamená promluvit?
                </motion.h2>
                <motion.div variants={fuaItem} className="w-16 h-[3px] bg-gradient-to-r from-accent-red to-accent-gold rounded-full" />
                
                <motion.div variants={fuaItem} className="space-y-4 text-text-muted leading-relaxed text-base md:text-lg">
                  <p>
                    Mlčení a promluvení jsou dvě základní reakce na nespravedlnost, problémy a konflikty, které nás obklopují. 
                    <strong className="text-text-light font-semibold"> Mlčet</strong> znamená zdržet se vyjádření, nepřejít v akci, zůstat stranou. 
                    <strong className="text-text-light font-semibold"> Promluvit</strong> znamená projevit svůj názor, upozornit na problém, postavit se za to, co považujeme za morálně správné.
                  </p>
                  <p>
                    Zásadní premise tohoto interaktivního zamyšlení zní: <span className="text-accent-red font-semibold">Když mlčíš, dáváš najevo implicitní souhlas.</span> Pokud se neozveš proti něčemu špatnému, svým tichým přihlížením to vlastně uvolňuješ do světa. Mlčení není lhostejná nečinnost — je to rozhodnutí, které dává zelenou těm, kteří škodí.
                  </p>
                </motion.div>
              </motion.div>

              {/* Burke Quote */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative p-6 bg-accent-red/[0.02] border-l-4 border-accent-red rounded-r-2xl"
              >
                <p className="font-serif italic text-base md:text-lg text-text-light mb-4 leading-relaxed">
                  "Vše, co je k tomu potřeba, aby zlo zvítězilo, je, aby dobří lidé nedělali nic (mlčeli)."
                </p>
                <span className="text-xs tracking-widest text-accent-gold font-bold uppercase block">— Edmund Burke</span>
              </motion.div>
            </div>

            {/* Right Column: Statistics panels stacked nicely */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-3 group hover:border-accent-red/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <CounterUp target={75} suffix="%" />
                  <div className="w-8 h-8 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wider text-text-muted font-bold group-hover:text-text-light transition-colors">
                  Lidí mlčí, když vidí šikanu
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Statistický průměr ve školních třídách a na pracovištích, kde se projevuje efekt přihlížejícího.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-3 group hover:border-accent-gold/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <CounterUp target={90} suffix="%" />
                  <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wider text-text-muted font-bold group-hover:text-text-light transition-colors">
                  Cítí ulehčení při promluvení
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Drtivá většina cítí hluboké vnitřní ulehčení a sebeúctu, když se ozve.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-3 group hover:border-accent-purple/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <CounterUp target={1} suffix=" stačí" />
                  <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wider text-text-muted font-bold group-hover:text-text-light transition-colors">
                  Hlas k protržení bariéry strachu
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  První jasný projev odporu dodá odvahu ostatním přihlížejícím.
                </p>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* --- DILEMMA SECTION (TABS) WITH CROSS-FADES --- */}
      <section id="dilema" className="py-24 md:py-36 bg-bg-dark border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-accent-red font-bold block">Hlubší zamyšlení</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Proč mlčíme? Jak ticho utváří realitu?
            </h2>
            <div className="w-16 h-1 bg-accent-red mx-auto rounded-full" />
            <p className="text-text-muted text-base md:text-lg">
              Lidská mysl je neuvěřitelně tvořivá při hledání výmluv. Pojďme upřímně prozkoumat pilíře našeho chování.
            </p>
          </div>

          {/* Interactive Navigation Elements for Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => handleTabChange("tišina")}
              className={`px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "tišina" 
                  ? "bg-accent-red text-white shadow-lg shadow-accent-red/30 border border-accent-red" 
                  : "bg-white/[0.02] text-text-muted border border-white/5 hover:text-text-light hover:border-white/20"
              }`}
            >
              🤫 Tišina není neutrální
            </button>
            <button
              onClick={() => handleTabChange("strach")}
              className={`px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "strach" 
                  ? "bg-accent-red text-white shadow-lg shadow-accent-red/30 border border-accent-red" 
                  : "bg-white/[0.02] text-text-muted border border-white/5 hover:text-text-light hover:border-white/20"
              }`}
            >
              😟 Strach z následků
            </button>
            <button
              onClick={() => handleTabChange("spolecenstvi")}
              className={`px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "spolecenstvi" 
                  ? "bg-accent-red text-white shadow-lg shadow-accent-red/30 border border-accent-red" 
                  : "bg-white/[0.02] text-text-muted border border-white/5 hover:text-text-light hover:border-white/20"
              }`}
            >
              ✊ Společenská kultura
            </button>
          </div>

          {/* Tab content renderer with beautiful micro anims */}
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden min-h-[420px]">
            <AnimatePresence mode="wait">
              {activeTab === "tišina" && (
                <motion.div
                  key="tišina-tab"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-text-light">
                      Ticho je zpráva samo o sobě
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Když vidíte někoho ublížit druhému a zůstanete mlčet, vaše ticho vysílá dvě zraňující zprávy. Agresorovi tím sdělujete: <span className="text-text-light">"Můžeš pokračovat. Nebudu ti překážet."</span> Oběti tím bezvýchodně oznamujete: <span className="text-text-light">"Jsi v tom sama. Nikdo za tebou nestojí."</span>
                    </p>
                    <p className="text-text-muted leading-relaxed">
                      Mlčení upevňuje falešný společenský konsenzus. V tiché místnosti se všichni domnívají, že ostatní s daným stavem souhlasí. Tím se nevědomě prodlužuje strach oběti a dává prostor lhostejnosti.
                    </p>
                  </div>
                  <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                    <div className="p-6 bg-accent-red/[0.03] border-l-4 border-accent-red rounded-r-2xl">
                      <p className="font-serif italic text-text-light text-base leading-relaxed">
                        "Nakonec si nebudeme pamatovat slova našich nepřátel, ale hluboké, lhostejné mlčení našich přátel."
                      </p>
                      <span className="text-xs text-accent-gold font-bold block mt-2 font-sans">— Martin Luther King Jr.</span>
                    </div>

                    <div className="p-6 bg-accent-gold/[0.03] border-l-4 border-accent-gold rounded-r-2xl">
                      <p className="font-serif italic text-text-light text-base leading-relaxed">
                        "Nikdo není plně svobodný, dokud je někdo jiný držen v okovech."
                      </p>
                      <span className="text-xs text-accent-gold font-bold block mt-2 font-sans">— Nelson Mandela</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "strach" && (
                <motion.div
                  key="strach-tab"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-text-light">
                      Strach je přirozený. Ale nesmí nás ovládnout.
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Bát se konfliktů, ztráty přátel či odplaty je zcela legitimní lidská reakce. Náš mozek je evolučně nastaven na přežití, a nejbezpečnější cestou k přežití se zdálo být nevystupování z řady.
                    </p>
                    <p className="text-text-muted leading-relaxed">
                      Avšak když přihlížíme zlu ze strachu, stáváme se jeho nepřímými komplici. Strach v naší představivosti bývá mnohem děsivější než v realitě. Překonání obavy a vyřknutí jediného klidného slova často zlomí iluzi neporazitelnosti agresora.
                    </p>
                  </div>
                  <div className="lg:col-span-12 xl:col-span-5 bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="text-accent-red font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Nejčastější paralyzující tóniny:
                    </h4>
                    <ul className="space-y-3 text-sm text-text-muted">
                      <li className="flex items-start gap-2">
                        <span className="text-accent-red font-bold">✕</span>
                        <span>"Ostatní s tím nemají žádný problém, proč já?"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-red font-bold">✕</span>
                        <span>"Stejně by můj jeden hlas nic nezměnil."</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-red font-bold">✕</span>
                        <span>"Není to můj boj, mají si to vyřešit sami."</span>
                      </li>
                    </ul>

                    <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-xs text-text-muted leading-relaxed">
                      ⚠️ Každá z těchto vět je psychologická obrana, která dává moci manipulujících jasný prostor pokračovat.
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "spolecenstvi" && (
                <motion.div
                  key="spolecenstvi-tab"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-text-light">
                      Kolektivní síla tvoří kulturu
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      Společnost nestojí na pouhých zákonech zapsaných na papíru, ale na sdílených, žitých pravidlech a hodnotách. Když vidíme chování odporující našim hodnotám a přejdeme ho mlčením, tyto hodnoty v reálném světě devalvujeme.
                    </p>
                    <p className="text-text-muted leading-relaxed">
                      Zdravé komunity vyžadují nepřetržité zapojení. Každý náš postoj, slovo podepsání, nebo jasný nesouhlas vysílá do světa tichou zprávu. Vaše okolí pečlivě pozoruje, jestli se za svá slova skutečně postavíte.
                    </p>
                  </div>
                  <div className="lg:col-span-12 xl:col-span-5 bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="text-accent-gold font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent-gold" />
                      Co se změní, když promluvíme:
                    </h4>
                    <ul className="space-y-3 text-sm text-text-muted">
                      <li className="flex items-start gap-2">
                        <span className="text-accent-gold font-bold">✓</span>
                        <span>Ukončíme osamělou úzkost napadaného člověka.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-gold font-bold">✓</span>
                        <span>Zboříme falešnou představu agresora o podpoře.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-gold font-bold">✓</span>
                        <span>Vytvoříme domino efekt odvahy pro ostatní lidi.</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- TIMELINE SECTION (HISTORIE) WITH ANIMATED VERTICAL PATH --- */}
      <section id="historie" className="py-24 md:py-36 bg-bg-section/80 border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20 animate-on-view">
            <span className="text-xs uppercase tracking-widest text-accent-gold font-bold block">Dějinná perspektiva</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Mlčení v dějinách: Když ticho křičelo nejvíc
            </h2>
            <div className="w-16 h-1 bg-accent-gold mx-auto rounded-full" />
            <p className="text-text-muted text-base md:text-lg">
              Historie je často mozaikou tragédií, které uvolnila lhostejná mlčící většina, i svědectvím o mimořádné statečnosti těch několika, co se odmítli ohnout.
            </p>
          </div>

          <div className="relative border-l border-white/10 md:border-l-0 md:after:absolute md:after:top-0 md:after:bottom-0 md:after:left-1/2 md:after:w-[1px] md:after:bg-gradient-to-b md:after:from-transparent md:after:via-accent-red md:after:to-transparent space-y-12 pl-6 md:pl-0">
            
            {/* Timeline Item 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="relative grid grid-cols-1 md:grid-cols-12 md:gap-8 items-center"
            >
              <div className="hidden md:block col-span-5 text-right space-y-2">
                <span className="font-serif text-3xl font-bold text-accent-gold">1938</span>
                <h4 className="text-lg font-bold text-text-light font-sans">Mnichovská dohoda a tiché lhostejno</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  Když tehdejší evropské mocnosti v naději na uchování vlastního klidu mlčely k porušení sovereignty Československa, dali tím agresorovi signál, že mohou postupovat dál. Tento tichý ústupek stál životy desítek milionů lidí v následné světové válce.
                </p>
              </div>
              <div className="absolute left-0 translate-x-[-31px] md:left-1/2 md:-translate-x-1/2 z-20 w-4 h-4 rounded-full bg-accent-red border-4 border-bg-dark ring-4 ring-accent-red/20 shadow-lg" />
              <div className="md:col-span-2" />
              <div className="col-span-12 md:col-span-5 space-y-2 md:hidden">
                <span className="font-serif text-2xl font-bold text-accent-gold">1938</span>
                <h4 className="text-lg font-bold text-text-light">Mnichovská dohoda a tiché lhostejno</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  Když tehdejší evropské mocnosti v naději na uchování vlastního klidu mlčely k porušení sovereignty Československa, dali tím agresorovi signál, že mohou postupovat dál. Tento tichý ústupek stál životy desítek milionů lidí v následné světové válce.
                </p>
              </div>
            </motion.div>

            {/* Timeline Item 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="relative grid grid-cols-1 md:grid-cols-12 md:gap-8 items-center"
            >
              <div className="md:col-span-5 md:hidden space-y-2">
                <span className="font-serif text-2xl font-bold text-accent-gold">1948–1989</span>
                <h4 className="text-lg font-bold text-text-light font-sans">Komunistická totalita a nucené ticho</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  V autoritářských režimech bylo mlčení primární obranou obyvatelsta ze strachu o uplatnění rodiny, zaměstnání či svobodu. Charta 77 a disidentská hnutí však představovaly vzepření — zvednout ruku a promluvit v té době vyžadovalo hrdinskou obětavost.
                </p>
              </div>
              <div className="hidden md:block col-span-5" />
              <div className="md:col-span-2" />
              <div className="absolute left-0 translate-x-[-31px] md:left-1/2 md:-translate-x-1/2 z-20 w-4 h-4 rounded-full bg-accent-red border-4 border-bg-dark ring-4 ring-accent-red/20 shadow-lg" />
              <div className="hidden md:block col-span-5 text-left space-y-2">
                <span className="font-serif text-3xl font-bold text-accent-gold">1948–1989</span>
                <h4 className="text-lg font-bold text-text-light font-sans">Komunistická totalita a nucené ticho</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  V autoritářských režimech bylo mlčení primární obranou obyvatelsta ze strachu o uplatnění rodiny, zaměstnání či svobodu. Charta 77 a disidentská hnutí však představovaly vzepření — zvednout ruku a promluvit v té době vyžadovalo hrdinskou obětavost.
                </p>
              </div>
            </motion.div>

            {/* Timeline Item 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="relative grid grid-cols-1 md:grid-cols-12 md:gap-8 items-center"
            >
              <div className="hidden md:block col-span-5 text-right space-y-2">
                <span className="font-serif text-3xl font-bold text-accent-gold">1989</span>
                <h4 className="text-lg font-bold text-text-light font-sans">Sametová revoluce: Konec strachu</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  Zvonění klíči na Letné a Václavském náměstí znamenalo masivní uvolnění letitých tichých vnitřních nesouhlasů. Ukázalo se, že zkostnatělý státní aparát, který se zdál být nepokořitelný, neměl odpověď na jednotný a hlasitý tón statisíců toužících po pravdě.
                </p>
              </div>
              <div className="absolute left-0 translate-x-[-31px] md:left-1/2 md:-translate-x-1/2 z-20 w-4 h-4 rounded-full bg-accent-red border-4 border-bg-dark ring-4 ring-accent-red/20 shadow-lg" />
              <div className="md:col-span-2" />
              <div className="col-span-12 md:col-span-5 space-y-2 md:hidden">
                <span className="font-serif text-2xl font-bold text-accent-gold">1989</span>
                <h4 className="text-lg font-bold text-text-light">Sametová revoluce: Konec strachu</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  Zvonění klíči na Letné a Václavském náměstí znamenalo masivní uvolnění letitých tichých vnitřních nesouhlasů. Ukázalo se, že zkostnatělý státní aparát, který se zdál být nepokořitelný, neměl odpověď na jednotný a hlasitý tón statisíců toužících po pravdě.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- SCROLLING QUOTES TICKER MARQUEE --- */}
      <section className="relative py-12 bg-bg-section border-y border-white/5 overflow-hidden select-none whitespace-nowrap">
        <div className="flex animate-marquee-slow hover:[animation-play-state:paused] gap-12 w-max">
          <div className="flex gap-16 items-center">
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Mlčení k nespravedlnosti je tichá zrada morálky."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Václav Havel</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Svět je nebezpečný. Ne kvůli zlým lidem, ale kvůli těm, co nečinně mlčí."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Albert Einstein</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Nikdy nepochoubuj o síle jediného vědomého hlasu."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Margaret Mead</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Kdo mlčí, dává najevo tichý souhlas."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Latinská moudrost</span>
            </div>
          </div>
          {/* Replica loop container for seamless flow */}
          <div className="flex gap-16 items-center" aria-hidden="true">
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Mlčení k nespravedlnosti je tichá zrada morálky."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Václav Havel</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Svět je nebezpečný. Ne kvůli zlým lidem, ale kvůli těm, co nečinně mlčí."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Albert Einstein</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Nikdy nepochoubuj o síle jediného vědomého hlasu."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Margaret Mead</span>
            </div>
            <div className="inline-block">
              <p className="font-serif italic text-lg sm:text-xl text-text-light">"Kdo mlčí, dává najevo tichý souhlas."</p>
              <span className="text-xs text-accent-red tracking-wider uppercase font-semibold mt-1 block font-sans">— Latinská moudrost</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- MODERN WORLD BENTO GRID (DNES) WITH CASCADE REVEALS --- */}
      <section id="dnes" className="py-24 md:py-36 bg-bg-dark border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-accent-purple font-bold block">Mlčení ve všední kultuře</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Kde ticho vytváří tichý souhlas každý den?
            </h2>
            <div className="w-16 h-1 bg-accent-purple mx-auto rounded-full" />
            <p className="text-text-muted text-base md:text-lg">
              Možná se neocitáme uprostřed světových válek, ale každých 24 hodin čelíme desítkám momentů, ve kterých se můžeme ozvat — nebo tiše poodstoupit dál.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fuaParent}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Bento block 1 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-red/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-red/10 flex items-center justify-center text-accent-red group-hover:scale-110 transition-transform duration-350">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Šikana v kolektivech</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Při napadení se málokdy zapojí všichni. Ale nejvlivnější je přihlížející mlčící většina. Agresor čte toto ticho jako dychtivou podporu a právo pokračovat.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-red bg-accent-red/10 px-3 py-1 rounded-full">Sociální</span>
                <span className="text-xs text-text-muted">Bystander efekt</span>
              </div>
            </motion.div>

            {/* Bento block 2 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-gold/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform duration-350">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Toxická pracovní kultura</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Diskriminace, mobbing nebo krádeže zásluh na poradách. Sklopené oči z obavy o postihy upevňují beztrestnost toxických manažerů, což postupně vyčerpává celý tým.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold bg-accent-gold/10 px-3 py-1 rounded-full">Pracoviště</span>
                <span className="text-xs text-text-muted">Ozvat se včas</span>
              </div>
            </motion.div>

            {/* Bento block 3 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-purple/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover:scale-110 transition-transform duration-350">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Kyberšikana a sítě</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Digitální platformy umožňují bezpečné lynčování z pohodlí domova. Skrolovat netečně dál kolem nenávisti a urážek ji plíživě činí standardní normou pro mladší generace.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-purple bg-accent-purple/10 px-3 py-1 rounded-full">Digitální</span>
                <span className="text-xs text-text-muted">Pasivita sítí</span>
              </div>
            </motion.div>

            {/* Bento block 4 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-blue/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform duration-350">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Demokratický prostor</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Ignorování korupčních vazeb či osekávání rovných práv vede k rozkladu občanského základu. Demokracie vyžaduje trvalou angažovanost a nepolevující morální korektiv.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full">Společnost</span>
                <span className="text-xs text-text-muted">Demokratický tón</span>
              </div>
            </motion.div>

            {/* Bento block 5 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-red/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-red/10 flex items-center justify-center text-accent-red group-hover:scale-110 transition-transform duration-350">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Domácí násilí a tabu</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Závislosti či týrání za zavřenými dveřmi. Držení se kréda "co se doma uvaří, to se tam sní" zcela odřezává oběti od záchranných kanálů a udržuje je v nekonečných cyklech úzkosti.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-red bg-accent-red/10 px-3 py-1 rounded-full">Rodinné</span>
                <span className="text-xs text-text-muted">Prolomit tabu</span>
              </div>
            </motion.div>

            {/* Bento block 6 */}
            <motion.div 
              variants={fuaItem}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-accent-gold/30 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform duration-350">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-text-light">Globální nezájem</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Ničení ekosystémů, hladomory a nespravedlnosti přecházíme pouhým posunutím obrazovky. Zvednout globální morální apel vyžaduje hlasité procitnutí milionů jednotlivců.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold bg-accent-gold/10 px-3 py-1 rounded-full">Planeta</span>
                <span className="text-xs text-text-muted">Budoucnost</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* --- SCENARIOS COMPARISON WITH ENTRANCES --- */}
      <section className="py-24 md:py-36 bg-bg-section/60 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 animate-on-view">
            <span className="text-xs uppercase tracking-widest text-[#e63946] font-bold block font-sans">Následky voleb</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Dva scénáře: Cesta mlčení vs. Cesta slova
            </h2>
            <div className="w-16 h-1 bg-accent-red mx-auto rounded-full" />
            <p className="text-text-muted leading-relaxed text-sm sm:text-base">
              Hledět stranou přináší chvilkový komfort, ale deformuje naši integritu. Podívejme se, kam tyto protichůdné stezky skutečně směřují.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Passive silence pathway */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, x: -30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.01] to-white/[0.03] border border-white/5 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 text-text-muted">
                    <EyeOff className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-text-muted">🤫 Cesta pasivního mlčení</h3>
                </div>
                <div className="w-full h-[1px] bg-white/5" />
                <ul className="space-y-4 text-text-muted text-sm sm:text-base">
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-red font-semibold select-none">⬇</span>
                    <span>Agresor získává dojem naprosté tiché podpory a ospravedlnění svých kroků.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-red font-semibold select-none">⬇</span>
                    <span>Oběť propadá hluboké rezignaci a pocitu naprostého opuštění celým světem.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-red font-semibold select-none">⬇</span>
                    <span>Násilné či lhostejné chování se postupně stává normou dané komunity.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-red font-semibold select-none">⬇</span>
                    <span>Časem přichází zklamání sebou samým a pozvolná eroze vlastní sebeúcty.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 text-xs text-text-muted italic">
                Výsledkem je tichá, ustrašená společnost bez důvěry a přátelství.
              </div>
            </motion.div>

            {/* Conscious voice pathway */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, x: 30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="p-8 sm:p-10 rounded-3xl bg-accent-red/[0.01] border border-accent-red/25 hover:border-accent-red/40 transition-colors duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-red/5 blur-3xl pointer-events-none" />
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-red/10 text-accent-red animate-pulse">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-accent-red">📢 Cesta vědomého slova</h3>
                </div>
                <div className="w-full h-[1px] bg-accent-red/15" />
                <ul className="space-y-4 text-text-light text-sm sm:text-base">
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-gold font-bold select-none">▲</span>
                    <span>Narušujeme aggressorův nekorektní sen o imunitě a všeobecném přitakání.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-gold font-bold select-none">▲</span>
                    <span>Dáváme oběti vědět, že v tom není sama a že na světě zbyla trocha lidskosti.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-gold font-bold select-none">▲</span>
                    <span>Problém se přesouvá na denní světlo, kde ho již nelze jednoduše přehlížet.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-accent-gold font-bold select-none">▲</span>
                    <span>Upevňujeme soulad s morálním kompasem, čímž zásadně posilujeme sebevědomí.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-accent-red/15 text-xs text-accent-red/60 italic font-sans">
                Výsledkem je posílení bezpečnějšího a solidárního prostředí.
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- POLL SECTION (INTERACTIVE STAGE) --- */}
      <section className="py-24 md:py-36 bg-bg-dark border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-12">
            <span className="text-xs uppercase tracking-widest text-[#f4a261] font-bold block font-sans">Interaktivní situace</span>
            <h2 className="text-4xl font-serif font-bold text-text-light">
              Jak byste se v krizové chvíli zachovali vy?
            </h2>
            <p className="text-text-muted max-w-lg mx-auto leading-relaxed text-sm md:text-base">
              Představte si modelový okamžik: Vidíte zjevné bezpráví či šikanu na veřejnosti. Všichni okolo ustrašeně mlčí. Jak odpoví vaše nitro?
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-accent-red via-accent-gold to-accent-purple opacity-35 animate-pulse" />
            
            <h3 className="text-2xl font-serif font-semibold text-text-light mb-8">
              Vaše okamžitá volba:
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                id="btn-vote-silence"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePollVote("silence")}
                className={`px-5 py-2.5 rounded-xl border text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  pollChoice === "silence"
                    ? "bg-white/[0.08] border-white/20 text-white shadow-lg shadow-white/5"
                    : "bg-white/[0.01] border-white/5 text-text-muted hover:border-white/15 hover:text-white"
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Budu mlčet</span>
              </motion.button>

              <motion.button
                id="btn-vote-voice"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePollVote("voice")}
                className={`px-5 py-2.5 rounded-xl border text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  pollChoice === "voice"
                    ? "bg-accent-red border-accent-red text-white shadow-lg shadow-accent-red/20"
                    : "bg-accent-red/10 border-accent-red/15 text-accent-red hover:bg-accent-red/20 hover:border-accent-red/30"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Promluvím</span>
              </motion.button>
            </div>

            {/* Live distribution progress bar statistics - shown only after voting */}
            <AnimatePresence>
              {pollChoice ? (() => {
                const totalVotes = pollVotes.silence + pollVotes.voice;
                const silencePercent = totalVotes > 0 ? Math.round((pollVotes.silence / totalVotes) * 100) : 0;
                const voicePercent = totalVotes > 0 ? 100 - silencePercent : 0;
                return (
                  <motion.div
                    key="livedistribution-stats"
                    initial={{ opacity: 0, height: 0, y: 15 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="mt-8 max-w-sm mx-auto space-y-3 overflow-hidden text-left"
                  >
                    <div className="flex justify-between text-[11px] text-text-muted uppercase tracking-widest px-0.5">
                      <span className="flex items-center gap-1.5 font-sans font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        Budu mlčet: {silencePercent}%
                      </span>
                      <span className="flex items-center gap-1.5 text-accent-red font-sans font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
                        Promluvím: {voicePercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <motion.div 
                        className="bg-white/20" 
                        initial={{ width: 0 }}
                        animate={{ width: `${silencePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="bg-accent-red" 
                        initial={{ width: 0 }}
                        animate={{ width: `${voicePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                );
              })() : null}
            </AnimatePresence>

            {/* Response Evaluation feedback block - shown underneath statistics */}
            <AnimatePresence mode="wait">
              {pollChoice && (
                <motion.div
                  key={pollChoice}
                  initial={{ opacity: 0, y: 15, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -15, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="mt-8 p-5 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-3 overflow-hidden"
                >
                  {pollChoice === "silence" ? (
                    <>
                      <div className="flex items-center gap-2 text-accent-gold">
                        <AlertTriangle className="w-4 h-4 text-accent-gold" />
                        <h4 className="font-serif font-bold text-base text-text-light">Strach a nejistota jsou přirozené.</h4>
                      </div>
                      <p className="text-text-muted leading-relaxed text-xs md:text-sm">
                        Přiznání vlastních obav o bezpečí je hluboce lidský a upřímný krok. Lidský mozek léta usiloval o přežití skrytím se. Zkuste se však zamyslet:
                        <strong className="text-text-light block mt-2 font-sans font-medium text-xs">Co kdybychom příště začali pomalým krůčkem?</strong>
                        Ozvat se nemusí znamenat divoký konflikt. Pomoci se dá i tichou přítomností — jít po incidentu přímo k napadenému, vyjádřit mu osobní podporu a odvést ho stranou. Prolomení bezútěšnosti má mnoho drobných podob.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-accent-red">
                        <Volume2 className="w-4 h-4 text-accent-red animate-pulse" />
                        <h4 className="font-serif font-bold text-base text-text-light">Skvělé! Rozhodli jste se pozvednout svůj vnitřní hlas.</h4>
                      </div>
                      <p className="text-text-muted leading-relaxed text-xs md:text-sm">
                        Vaše vnitřní nastavení drží silný a spolehlivý směr. Promluvit do napjaté situace s sebou nese nepohodlí, ale přináší nebývalé vysvobození pro oběť i zbytek ustrašených.
                        Jakmile klidně pronesete <span className="text-accent-gold italic font-semibold">"Tohle se mi nelíbí,"</span> strhnete bariéru strachu a ostatní se k vám často bleskově připojí.
                        <strong className="text-accent-red block mt-2 font-sans font-medium text-xs">Vaše reakce má transformační sílu.</strong>
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION WITH SMOOTH SLIDE-DOWN ACCORDIONS --- */}
      <section id="faq" className="py-24 md:py-36 bg-bg-section/80 border-t border-white/5 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 animate-on-view">
            <span className="text-xs uppercase tracking-widest text-accent-red font-bold block">Časté dotazy</span>
            <h2 className="text-4xl font-serif font-bold text-text-light">
              Otázky, které si v duchu klademe
            </h2>
            <div className="w-16 h-1 bg-accent-red mx-auto rounded-full" />
            <p className="text-text-muted leading-relaxed">
              Odpovědi na zneklidňující pochybnosti a nejistoty, které probíhají naší hlavou v krizových chvílích.
            </p>
          </div>

          <div className="space-y-4">
            <AccordionItem
              title="Je správné se ozvat vždycky a za každou cenu?"
              content="Morálka by neměla ignorovat pud sebezáchovy. Pokud čelní konfrontace bezprostředně ohrožuje vaše fyzické bezpečí, zvolte nepřímou cestu: volejte tísňovou linku, přizvěte kolemjdoucí lidi, zaangažujte ostrahu prostoru, nebo oslovte oběť a odveďte ji pryč. Nejdůležitější je nerezignovat na lhostejnost."
              isOpen={openAccordionIndex === 0}
              onToggle={() => handleToggleAccordion(0)}
            />

            <AccordionItem
              title="Má to smysl, i když budu jediný, kdo promluví?"
              content="Má to ten vůbec největší možný smysl! Všechny velké společenské milníky i menší každodenní obraty začínaly u jednoho osamělého hlasu. V sociální psychologii se tomu říká rozbití konsenzu. Jakmile se odvážíte označit špatné chování pravým jménem, zbavíte situaci falešného ticha a ostatní lide, co se prali se strachem, získají odvahu se přidat."
              isOpen={openAccordionIndex === 1}
              onToggle={() => handleToggleAccordion(1)}
            />

            <AccordionItem
              title="Jak se naučit překonávat návyk tichého sklonění hlavy?"
              content="Cvičením. Asertivita a statečnost nejsou vytesané do genetické struktury, je to sval. Začněte v bezpečném prostředí: nezasmějte se dehonestujícímu xenofobnímu vtipu kolegy, vyjádřete klidný nesouhlas s drobným nátlakem na poradě, podepište petiční arch. Postupné krůčky vás připraví na složitější životní zkoušky."
              isOpen={openAccordionIndex === 2}
              onToggle={() => handleToggleAccordion(2)}
            />

            <AccordionItem
              title="Může být mlčení někdy skutečnou ctností?"
              content="Ano — pokud slouží jako prostor pro empatické, uctivé naslouchání s cílem porozumět druhému člověku v jeho trápení či bolesti. Vytvoření takového vnitřního klidu je cenným darem. Je v tom zásadní rozdíl: tiché empatické naslouchání je aktivní, láskyplná přítomnost, zatímco ticho před bezprávím je pasivní strach. Vše plyne z úmyslu uvnitř."
              isOpen={openAccordionIndex === 3}
              onToggle={() => handleToggleAccordion(3)}
            />
          </div>
        </div>
      </section>

      {/* --- PRACTICAL STEPS (AKCE) WITH CASCADE CARD ANIMATIONS --- */}
      <section id="akce" className="py-24 md:py-36 bg-bg-dark border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase tracking-widest text-accent-gold font-bold block">Praktický průvodce</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Jak začít mluvit: 6 praktických kroků
            </h2>
            <div className="w-16 h-1 bg-accent-gold mx-auto rounded-full" />
            <p className="text-text-muted leading-relaxed text-sm sm:text-base">
              Nebojácnost není dar vyvolených, ale trénovatelná praxe. Zde je prověřený manuál, pro každodenní obranu lidské integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">01</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Uvědomte si moment volby</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                První boj se odehrává v hlavě. Všimněte si přesného fyzického okamžiku sevření, kdy se ve vás tluče potřeba se skrýt s vědomím povinnosti zasáhnout.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">02</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Připravte si své věty předem</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Nenechte se paralyzovat překvapením. Připravte si dopředu jednoduché, asertivní a věcné odpovědi typu: <span className="text-accent-gold font-semibold">"Tohle se mi nelíbí,"</span> nebo <span className="text-accent-gold font-semibold">"Tohle zde nebudeme snášet."</span>
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">03</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Začněte od maličkostí</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Netlačte hned na revoluce. Trénujte asertivní postoj u drobných situací: klidně vyjádřete nesouhlas se šířením drbů nebo toxickými stereotypy na schůzce.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">04</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Vyhledejte spojence</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Ve dvou či třech se to táhne lépe. Obklopte se lidmi se shodnými morálními hodnotami, se kterými si v krizové vteřině vyjádříte jasnou a jistou koordinaci.
              </p>
            </motion.div>

            {/* Step 5 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">05</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Skutečně naslouchejte</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Konstruktivní promluvení nespočívá v bezhlavém křiku, ale v porozumění. Vyslechněte napřed utlačované, pochopte hloubku a mluvte s nimi, ne za ně.
              </p>
            </motion.div>

            {/* Step 6 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-gold/25 transition-all duration-300 space-y-4 group"
            >
              <span className="font-serif text-5xl font-black text-accent-gold/10 group-hover:text-accent-gold/20 transition-colors absolute top-4 right-6 select-none font-serif">06</span>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-text-light">Mějte se sebou trpělivost</h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Někdy strach vyhraje a vy sklopíte zrak. Netrestejte se. Lidská psychika je mimořádně komplexní. Nejdůležitější je vzít si z toho ponaučení a příští střet zkusit znovu.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- DISKŮZNÍ FÓRUM (DISKUZE) POWERED BY FIRESTORE --- */}
      <section id="diskuze" className="relative py-24 md:py-32 bg-[#08080c] border-t border-white/5 scroll-mt-20">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-accent-gold/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-accent-red/5 blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-light">
              Setkal ses s něčím takovým i ty?
            </h2>
            <div className="w-16 h-1 bg-accent-red mx-auto rounded-full" />
            <p className="text-text-muted leading-relaxed text-sm sm:text-base">
              Poděl se o svůj názor nebo poznámku. Všechny vzkazy jsou publikovány zcela anonymně.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Form Card with Authentication */}
            <div className="lg:col-span-5 bg-[#0b0b10] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <h3 className="text-xl font-bold text-text-light flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-accent-red" />
                  <span>Napiš svůj názor</span>
                </h3>
              </div>

              <form onSubmit={handleOpinionSubmit} className="space-y-5">

                {/* Message Input text area - Single Textarea input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="opinion-text" className="block text-xs uppercase tracking-wider text-text-muted font-bold">
                      Text názoru
                    </label>
                    <span className="text-[10px] text-text-muted font-mono">
                      {2000 - opinionText.length} zbývá
                    </span>
                  </div>
                  <textarea
                    id="opinion-text"
                    required
                    rows={6}
                    value={opinionText}
                    onChange={(e) => setOpinionText(e.target.value.slice(0, 2000))}
                    placeholder="Sem napiš, s čím jsi se setkal, co si o této problematice myslíš, nebo jaký vliv má ticho na společnost..."
                    className="w-full px-4 py-3 bg-white/[0.01] border border-white/5 focus:border-accent-red/40 rounded-2xl text-text-light placeholder:text-text-muted/50 text-sm transition-colors outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Form feedback notifications */}
                <AnimatePresence>
                  {opinionError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3 py-2 rounded-xl flex items-center gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{opinionError}</span>
                    </motion.div>
                  )}
                  {opinionSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Váš názor byl úspěšně anonymně odeslán do databáze.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Combined Action Button */}
                <button
                  id="opinion-submit-btn"
                  type={user ? "submit" : "button"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setShowLoginModal(true);
                      if (audioEnabled) {
                        audioSynth.playChime(587.33);
                      }
                    }
                  }}
                  disabled={user ? (isSubmittingOpinion || !opinionText.trim()) : false}
                  className="w-full py-4 bg-gradient-to-r from-accent-red to-[#c1121f] text-white uppercase tracking-wider text-xs font-bold rounded-2xl hover:shadow-lg hover:shadow-accent-red/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingOpinion ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : user ? (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Odeslat názor anonymně</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Nejprve se přihlaste pro odeslání</span>
                    </>
                  )}
                </button>

                {!user && (
                  <p id="auth-disclaimer-text" className="text-[10px] text-text-muted/50 text-center leading-relaxed font-sans">
                    Názor bude publikován zcela anonymně. Jednorázové přihlášení slouží čistě jako prevence proti spamu a robotům.
                  </p>
                )}
              </form>
            </div>

            {/* Right Column: Clean single-column layout for post letters feed */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <h3 className="text-xl font-bold text-text-light flex items-center gap-2 font-serif">
                  <Bookmark className="w-4 h-4 text-accent-gold" />
                  <span>Diskuze ({opinions.length})</span>
                </h3>
              </div>

              {opinions.length === 0 ? (
                <div className="border border-white/5 rounded-3xl p-16 text-center text-text-muted bg-white/[0.005] flex flex-col items-center justify-center space-y-3">
                  <MessageCircle className="w-8 h-8 text-white/10" />
                  <p className="text-sm font-sans">Zatím se o svůj hlas nikdo nepodělil. Buď první, kdo prolomí ticho!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar" id="opinions-list">
                    <AnimatePresence mode="popLayout">
                      {paginatedOpinions.map((op, idx) => (
                        <motion.div
                          key={op.id || idx}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="p-6 bg-white/[0.01] border border-white/[0.03] hover:border-accent-red/20 rounded-2xl flex flex-col space-y-3 transition-all duration-300 group text-left relative"
                        >
                          <div className="text-sm sm:text-base text-text-light leading-relaxed font-sans whitespace-pre-wrap select-text italic">
                            „{op.text}“
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-text-muted/60 font-mono pt-2.5 border-t border-white/[0.02]">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                              Anonymní hlas
                            </span>
                            <div className="flex items-center gap-3">
                              <span>{formatCzechDate(op.createdAt)}</span>
                              {user && op.userId === user.uid && (
                                <button
                                  type="button"
                                  onClick={() => handleOpinionDelete(op.id)}
                                  className="p-1 text-text-muted/50 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center"
                                  title="Smazat příspěvek"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Elegant and Minimalist Czech Pagination Controls */}
                  {totalCommentsPages > 1 && (
                    <div className="flex items-center justify-between pt-3 text-xs border-t border-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentsPage((prev) => Math.max(1, prev - 1));
                          if (audioEnabled) {
                            audioSynth.playChime(440); // Sound tone callback
                          }
                        }}
                        disabled={activeCommentsPage === 1}
                        className="py-1.5 px-3 rounded-xl border border-white/5 bg-white/[0.01] text-text-muted hover:text-white hover:border-white/10 disabled:opacity-20 disabled:hover:border-white/5 disabled:hover:text-text-muted transition-all duration-300 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed font-medium font-sans"
                        title="Předchozí strana"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Předchozí</span>
                      </button>

                      <span className="font-mono text-text-muted/55 text-[11px] tracking-wide select-none">
                        Strana <span className="text-accent-gold font-bold">{activeCommentsPage}</span> z <span className="text-text-light/85 font-semibold">{totalCommentsPages}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setCommentsPage((prev) => Math.min(totalCommentsPages, prev + 1));
                          if (audioEnabled) {
                            audioSynth.playChime(494); // Sound tone callback
                          }
                        }}
                        disabled={activeCommentsPage === totalCommentsPages}
                        className="py-1.5 px-3 rounded-xl border border-white/5 bg-white/[0.01] text-text-muted hover:text-white hover:border-white/10 disabled:opacity-20 disabled:hover:border-white/5 disabled:hover:text-text-muted transition-all duration-300 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed font-medium font-sans"
                        title="Další strana"
                      >
                        <span>Další</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- ELITE FOOTER --- */}
      <footer className="bg-[#050508] border-t border-white/5 py-12 px-4 text-center select-none">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
            Navrženo a vytvořeno s respektem k morální integritě a odvaze lidského slova. <br className="hidden sm:inline" />
            Vždyť <a href="#hero-id" onClick={(e) => handleLinkClick(e, "hero-id")} className="text-accent-red hover:underline decoration-accent-red/50 font-semibold transition-colors duration-300">ticho je tichý souhlas</a> — a my všichni společně si zasloužíme spravedlivější svět.
          </p>
          <div className="text-[10px] text-white/20">
            © 2026 • Mlčet, nebo promluvit? • Všechna práva pro tvořivé hlasy zachována.
          </div>
        </div>
      </footer>

      {/* --- PREMIUM PORTRAIT SPACE AUTHENTICATION MODAL SCREEN --- */}
      <AnimatePresence>
        {showLoginModal && (
          <div 
            id="login-modal-overlay"
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4 md:p-6"
          >
            {/* Modal Backdrop overlay with heavy glass blur */}
            <motion.div
              id="login-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowLoginModal(false);
                resetAuthForm();
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-lg"
            />

            {/* Modal Split Box container */}
            <motion.div
              id="login-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -30 }}
              transition={{ type: "spring", duration: 0.55, bounce: 0.12 }}
              className="relative w-full max-w-4xl bg-bg-dark border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-2xl shadow-black h-fit min-h-[500px] z-20"
            >
              {/* Outer top floating close X utility */}
              <button
                id="login-modal-close"
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  resetAuthForm();
                }}
                className="absolute top-4 right-4 z-50 p-2 text-text-muted hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              {/* LEFT COLUMN: Modern sign-up & sign-in Form Interface */}
              <div className="p-8 sm:p-10 flex flex-col justify-between h-full bg-[#0b0b10] col-span-12 md:col-span-6 text-left relative z-10">
                <div>
                  <h3 id="auth-modal-title" className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mb-2">
                    {isRegistering ? "Vytvořit účet" : "Přihlásit se"}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted mb-6 font-sans">
                    {isRegistering 
                      ? "Vstupte do prostoru vzájemného sdílení a svobodného slova." 
                      : "Vraťte se do bezpečné zóny sdíleného hlasu a pravdy."}
                  </p>

                  {/* Google Authenticator triggering Option */}
                  <button
                    id="google-auth-btn"
                    type="button"
                    onClick={async () => {
                      await handleGoogleSignIn();
                      setShowLoginModal(false);
                      resetAuthForm();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-accent-red/40 hover:bg-white/[0.04] text-text-light font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span className="w-4 h-4 flex items-center justify-center font-bold text-red-500 font-sans text-sm">G</span>
                    <span>Přihlásit se přes Google</span>
                  </button>

                  {/* Standard styled partition divider */}
                  <div className="flex items-center my-6">
                    <div className="flex-grow h-[1px] bg-white/[0.06]" />
                    <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/50 font-sans">Nebo</span>
                    <div className="flex-grow h-[1px] bg-white/[0.06]" />
                  </div>

                  {/* Form actions */}
                  <form id="email-auth-form" onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-1.5" id="email-input-container">
                      <label htmlFor="auth-email" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted font-sans">
                        E-mailová adresa
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="jmeno@domena.cz"
                        className="w-full px-4 py-2.5 bg-white/[0.01] border border-white/5 focus:border-accent-red/30 rounded-xl text-text-light placeholder:text-text-muted/30 text-xs transition-colors outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-1.5" id="password-input-container">
                      <label htmlFor="auth-password" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted font-sans">
                        Heslo
                      </label>
                      <div className="relative">
                        <input
                          id="auth-password"
                          type={passwordVisible ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Minimálně 6 znaků"
                          className="w-full pl-4 pr-10 py-2.5 bg-white/[0.01] border border-white/5 focus:border-accent-red/30 rounded-xl text-text-light placeholder:text-text-muted/30 text-xs transition-colors outline-none font-sans"
                        />
                        <button
                          id="password-visibility-toggle"
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-white transition-colors cursor-pointer"
                        >
                          {passwordVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div id="auth-error-msg" className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    {loginSuccess && (
                      <div id="auth-success-msg" className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{loginSuccess}</span>
                      </div>
                    )}

                    <button
                      id="auth-submit-btn"
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3.5 bg-gradient-to-r from-accent-red to-[#c1121f] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-accent-red/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingAuth ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{isRegistering ? "Zaregistrovat se" : "Přihlásit se"}</span>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.04]">
                  <p className="text-xs text-text-muted text-center font-sans">
                    {isRegistering ? "Máte již vytvořený účet?" : "Nemáte ještě účet?"}{" "}
                    <button
                      id="auth-mode-switch"
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setLoginError("");
                        setLoginSuccess("");
                      }}
                      className="text-accent-red hover:text-accent-gold font-bold transition-colors underline decoration-accent-red/30 hover:decoration-accent-gold/50 cursor-pointer"
                    >
                      {isRegistering ? "Přihlaste se" : "Vytvořte si ho"}
                    </button>
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Splendid animated deep Space visuals layout and concept */}
              <div className="hidden md:flex col-span-6 relative bg-[#040406] overflow-hidden flex-col items-center justify-center p-10 text-center border-l border-white/5 select-none">
                {/* Micro stars and floating icons representing universe */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                  <div className="absolute top-[12%] left-[10%] text-xl animate-float-1">⭐</div>
                  <div className="absolute bottom-[16%] right-[10%] text-lg animate-float-3">✨</div>
                  <div className="absolute top-[65%] left-[15%] text-xs animate-float-2 opacity-50">☄️</div>
                  <div className="absolute top-[35%] right-[15%] text-sm animate-float-1 opacity-20">🪐</div>
                </div>

                {/* Subtle rich cosmic overlays */}
                <div className="absolute w-80 h-80 rounded-full bg-accent-red/10 blur-[90px] -top-16 -right-16 pointer-events-none" />
                <div className="absolute w-80 h-80 rounded-full bg-accent-purple/10 blur-[90px] -bottom-16 -left-16 pointer-events-none" />

                {/* Elegant central glossy deep space cosmos representation */}
                <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                  {/* Glowing core representing a cosmic galaxy center or nebula */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent-red/20 via-accent-gold/25 to-accent-purple/30 blur-3xl animate-pulse" />
                  
                  {/* Multi-layered sparkling orbits */}
                  <div className="absolute w-44 h-44 rounded-full border border-dashed border-accent-gold/25 animate-[spin_40s_linear_infinite]" />
                  <div className="absolute w-36 h-36 rounded-full border border-double border-accent-purple/30 animate-[spin_24s_linear_infinite_reverse]" />
                  <div className="absolute w-28 h-28 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]" />
                  
                  {/* Center glowing golden/accent cosmic star core */}
                  <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-[#9252f5] via-[#ea384c] to-[#fcc97c] shadow-[0_0_50px_rgba(234,56,76,0.4)] flex items-center justify-center animate-breathe-slow">
                    <div className="absolute inset-[2px] rounded-full bg-bg-dark flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-accent-gold animate-pulse" />
                    </div>
                  </div>

                  {/* Tiny sparkling satellite points orbiting the core */}
                  <div className="absolute top-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-ping" />
                  <div className="absolute bottom-[15%] right-[25%] w-1 h-1 rounded-full bg-accent-gold opacity-60 animate-pulse" />
                  <div className="absolute bottom-[30%] left-[10%] w-2 h-2 rounded-full bg-accent-purple/60 opacity-40 shrink-0" />
                </div>

                {/* Poetry Overlay text */}
                <div className="relative z-10 space-y-2 px-2">
                  <h4 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                    "Vesmír mlčí. <br />Ale ty nemusíš."
                  </h4>
                  <div className="w-8 h-[2px] bg-accent-red mx-auto my-3" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent-gold font-bold">
                    Tvůj hlas má hodnotu
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
