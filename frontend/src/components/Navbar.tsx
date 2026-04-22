import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useGetSmartTouristBootstrap, useSmartTouristLogin, useSmartTouristRegister, useRequestPasswordResetOtp, useUpdatePasswordWithOtp } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, getErrorMessage } from "@/lib/utils";


export function Navbar() {
  const { role, user, receptionist, adminName, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = useCallback(async () => {
    await logout();
    setLocation("/");
  }, [logout, setLocation]);

  useEffect(() => {
    window.addEventListener("smart-tourist-logout", handleLogout);
    return () => window.removeEventListener("smart-tourist-logout", handleLogout);
  }, [logout]);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-nav"
    >
      <div className="container flex h-20 items-center justify-between mx-auto px-6">
        <div className="flex gap-10 items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              if (role === "receptionist") {
                window.dispatchEvent(new CustomEvent("smart-tourist-reset-receptionist-dashboard"));
                setLocation("/receptionist");
              } else if (role === "user") {
                window.dispatchEvent(new CustomEvent("smart-tourist-reset-dashboard"));
                setLocation("/user");
              } else {
                setLocation("/");
              }
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-indigo-600">
              Smart Locker System
            </span>
          </motion.div>
          <nav className="flex gap-4 md:gap-8">
            <button 
              onClick={() => setLocation("/reviews")} 
              className={cn(
                "relative group text-sm font-black uppercase tracking-widest transition-all",
                location === "/reviews" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              Reviews
              <span className={cn(
                "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all",
                location === "/reviews" ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </button>

            {role === "user" && (
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("smart-tourist-reset-dashboard"));
                  setLocation("/user");
                }} 
                className="relative group text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                My Lockers
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </button>
            )}
            {role === "receptionist" && (
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("smart-tourist-reset-receptionist-dashboard"));
                  setLocation("/receptionist");
                }}
                className="relative group text-sm font-semibold text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              >
                Station Desk
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </button>
            )}
            {role === "admin" && (
              <Link href="/admin" className="relative group text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
                Admin Hub
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-6">
          <nav className="flex items-center space-x-4">
            {!role ? (
              <AuthDialogs />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-2xl bg-secondary/50 hover:bg-secondary border border-primary/10 overflow-hidden">
                    <User className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-2xl border-primary/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-bold leading-none">
                        {user?.name || receptionist?.name || adminName}
                      </p>
                      <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-widest font-black py-0.5">
                        {role === "user" ? "Traveler" : role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    {role === "user" && (
                      <DropdownMenuItem className="rounded-xl h-10" onClick={() => {
                        window.dispatchEvent(new CustomEvent("smart-tourist-reset-dashboard"));
                        setLocation("/user");
                      }}>
                        Locker Dashboard
                      </DropdownMenuItem>
                    )}
                    {role === "receptionist" && (
                      <DropdownMenuItem className="rounded-xl h-10" asChild>
                        <Link href="/receptionist">Station Control</Link>
                      </DropdownMenuItem>
                    )}
                    {role === "admin" && (
                      <DropdownMenuItem className="rounded-xl h-10" asChild>
                        <Link href="/admin">System Monitor</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="rounded-xl h-10 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Terminate Session</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}

function AuthDialogs() {
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  useEffect(() => {
    const openLoginDialog = () => setOpenLogin(true);
    window.addEventListener("smart-tourist-open-login", openLoginDialog);
    return () => window.removeEventListener("smart-tourist-open-login", openLoginDialog);
  }, []);

  useEffect(() => {
    const openRegisterDialog = () => setOpenRegister(true);
    window.addEventListener("smart-tourist-open-register", openRegisterDialog);
    return () => window.removeEventListener("smart-tourist-open-register", openRegisterDialog);
  }, []);
  
  const [openForgot, setOpenForgot] = useState(false);

  return (
    <>
      <LoginDialog open={openLogin} onOpenChange={setOpenLogin} onSwitch={() => { setOpenLogin(false); setOpenRegister(true); }} onForgot={() => { setOpenLogin(false); setOpenForgot(true); }} />
      <RegisterDialog open={openRegister} onOpenChange={setOpenRegister} onSwitch={() => { setOpenRegister(false); setOpenLogin(true); }} />
      <ForgotPasswordDialog open={openForgot} onOpenChange={setOpenForgot} onSwitch={() => { setOpenForgot(false); setOpenLogin(true); }} />
      
      <Button variant="ghost" onClick={() => setOpenLogin(true)} className="font-bold text-sm">Login</Button>
      <Button onClick={() => setOpenRegister(true)} className="font-bold text-sm rounded-xl px-6 shadow-lg shadow-primary/20">Get Started</Button>
    </>
  );
}

function LoginDialog({ open, onOpenChange, onSwitch, onForgot }: { open: boolean; onOpenChange: (open: boolean) => void; onSwitch: () => void; onForgot: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const loginMutation = useSmartTouristLogin();

  // Auto-detect role from identifier so admin & receptionist logins work
  // without requiring the user to pick a tab.
  const detectRole = (id: string): "user" | "receptionist" | "admin" => {
    const lower = id.trim().toLowerCase();
    if (lower === "admin@smartlocker.bd" || lower === "admin@smarttourist.bd") return "admin";
    if (lower.endsWith("@smartlocker.bd") || lower.endsWith("@smarttourist.bd")) return "receptionist";
    return "user";
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = detectRole(identifier);
    loginMutation.mutate({ data: { role, identifier, password } }, {
      onSuccess: (data) => {
        setAuth({
          role: data.role,
          user: data.user,
          receptionist: data.receptionist,
          adminName: data.adminName
        });
        toast({ title: "Session initialized successfully" });
        onOpenChange(false);
        if (data.role === "user") setLocation("/user");
        if (data.role === "receptionist") setLocation("/receptionist");
        if (data.role === "admin") setLocation("/admin");
      },
      onError: (err: any) => {
        const message = getErrorMessage(err);
        const friendlyTitle = message.includes("not found") ? "Account Not Found" : "Authentication Failed";
        
        toast({ 
          title: friendlyTitle, 
          description: message, 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-primary/10 shadow-2xl overflow-hidden p-0">
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <DialogTitle className="text-3xl font-black tracking-tighter">System Access</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium mt-1">
            Sign in to manage your smart locker assets.
          </DialogDescription>
        </div>

        <div className="p-8 space-y-8">

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="identifier" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Phone Number / Email
              </Label>
              <Input 
                id="identifier" 
                placeholder="Phone / Email / Staff ID"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                autoComplete="current-password"
                className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium"
              />
            </div>
          
            <div className="flex items-center justify-end">
              <button type="button" onClick={onForgot} className="text-[11px] font-bold text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors">
                Forgot Password?
              </button>
            </div>
            
            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 group" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Access System"}
            </Button>


            <div className="text-center text-sm font-medium text-muted-foreground">
              New to the system?{" "}
              <button type="button" onClick={onSwitch} className="text-primary font-black hover:underline underline-offset-4">
                Initialize Account
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RegisterDialog({ open, onOpenChange, onSwitch }: { open: boolean; onOpenChange: (open: boolean) => void; onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const registerMutation = useSmartTouristRegister();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { name, email, phone, address, photoUrl: "", password } }, {
      onSuccess: (data) => {
        setAuth({
          role: data.role,
          user: data.user,
          receptionist: data.receptionist,
          adminName: data.adminName
        });
        toast({ title: "Account created successfully" });
        onOpenChange(false);
        setLocation("/user");
      },
      onError: (err: any) => {
        const msg = err.message || "";
        const cleanMsg = msg.includes(":") ? msg.split(":").pop()?.trim() : msg;
        toast({ title: "Request Failed", description: cleanMsg || "Unable to send OTP. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create an Account</DialogTitle>
          <DialogDescription>
            Register as a traveler to book lockers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name</Label>
            <Input id="reg-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-phone">Phone Number</Label>
            <Input id="reg-phone" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-address">Address</Label>
            <Input id="reg-address" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <button type="button" onClick={onSwitch} className="text-primary font-medium hover:underline">
              Login here
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ForgotPasswordDialog({ open, onOpenChange, onSwitch }: { open: boolean; onOpenChange: (open: boolean) => void; onSwitch: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [otpId, setOtpId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { toast } = useToast();
  const requestOtpMutation = useRequestPasswordResetOtp();
  const updatePasswordMutation = useUpdatePasswordWithOtp();

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    
    // Prevent admin/staff from using this
    const lower = identifier.trim().toLowerCase();
    if (lower.endsWith("@smartlocker.bd") || lower.endsWith("@smarttourist.bd")) {
      toast({ title: "Operation Restricted", description: "Staff and Admin passwords cannot be reset here.", variant: "destructive" });
      return;
    }

    requestOtpMutation.mutate({ data: { identifier } }, {
      onSuccess: (data) => {
        setOtpId(data.otpId || "");
        toast({ title: "OTP Sent", description: data.message });
        setStep(2);
      },
      onError: (err: any) => {
        const msg = err.message || "";
        const cleanMsg = msg.includes(":") ? msg.split(":").pop()?.trim() : msg;
        toast({ title: "Request Failed", description: cleanMsg || "Unable to send OTP. Please try again.", variant: "destructive" });
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    updatePasswordMutation.mutate({ data: { otpId, otp, newPassword } }, {
      onSuccess: (data) => {
        toast({ title: "Success", description: data.message });
        onOpenChange(false);
        setStep(1);
        setIdentifier("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        onSwitch(); // Go back to login
      },
      onError: (err: any) => {
        const msg = err.message || "";
        const cleanMsg = msg.includes(":") ? msg.split(":").pop()?.trim() : msg;
        toast({ title: "Update Failed", description: cleanMsg || "Unable to update password. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setTimeout(() => setStep(1), 300);
      }
    }}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-primary/10 shadow-2xl overflow-hidden p-0">
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <DialogTitle className="text-3xl font-black tracking-tighter">
            {step === 1 ? "Reset Password" : "Verify & Update"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium mt-1">
            {step === 1 ? "Enter your phone or email to receive an OTP." : "Enter the OTP sent to your email and your new password."}
          </DialogDescription>
        </div>

        <div className="p-8 space-y-8">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="forgot-identifier" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Phone Number / Email
                </Label>
                <Input 
                  id="forgot-identifier" 
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium"
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 mt-4" disabled={requestOtpMutation.isPending}>
                {requestOtpMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="forgot-otp" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">OTP</Label>
                <Input 
                  id="forgot-otp" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium tracking-widest text-center"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="forgot-new-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">New Password</Label>
                <Input 
                  id="forgot-new-password" 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                  className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="forgot-confirm-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Password</Label>
                <Input 
                  id="forgot-confirm-password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                  className="h-14 rounded-2xl bg-muted/30 border-primary/5 focus:border-primary/20 transition-all font-medium"
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 mt-4" disabled={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm font-medium text-muted-foreground">
            Remember your password?{" "}
            <button type="button" onClick={onSwitch} className="text-primary font-black hover:underline underline-offset-4">
              Login here
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
