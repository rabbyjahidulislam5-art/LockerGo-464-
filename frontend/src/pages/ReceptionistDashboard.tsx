import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { 
  useGetSmartTouristReceptionistDashboard, 
  getGetSmartTouristReceptionistDashboardQueryKey,
  useGrantSmartTouristKey,
  useProcessSmartTouristReturn,
  useSmartTouristReceptionistAction,
  Booking,
  Locker,
  AuditLog
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, CheckCircle, CheckCircle2, Lock, Activity, AlertCircle, History, LogOut, Grid, Settings, MapPin, ShieldCheck, Calendar, Filter, Box, Clock, Users, User, CreditCard, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { cn, useRealtime, formatDateLocal, formatMonthLocal, formatDateTime } from "@/lib/utils";
import { useMemo } from "react";

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-muted rounded-2xl" />
          <div className="h-4 w-48 bg-muted rounded-lg" />
        </div>
        <div className="h-12 w-32 bg-muted rounded-xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted rounded-3xl" />
        ))}
      </div>
      <div className="h-[400px] bg-muted/50 rounded-[2.5rem]" />
    </div>
  );
}

export default function ReceptionistDashboard() {
  const { role, receptionistId, receptionist } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("lockers");
  const [activePaymentTab, setActivePaymentTab] = useState<string>("all_transactions");

  // Profile fields state
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (receptionist?.phone) {
      setProfilePhone(receptionist.phone);
    }
  }, [receptionist]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receptionistId) return;
    
    setIsUpdating(true);
    try {
      const payload: any = { phone: profilePhone };
      if (profilePassword) payload.password = profilePassword;

      const url = `/api/smart-tourist/receptionist/${receptionistId}/update-profile`;
      console.log(`[DEBUG] Updating profile at: ${url}`, payload);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMessage = `Server error (${res.status})`;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      toast({ title: "Success", description: data.message });
      setProfilePassword(""); // Clear password field
      
      // Update local auth state with new data
      window.dispatchEvent(new CustomEvent("smart-tourist-auth-refresh", { 
        detail: { receptionist: data.receptionist } 
      }));
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleReset = () => setActiveTab("lockers");
    window.addEventListener("smart-tourist-reset-receptionist-dashboard", handleReset);
    return () => window.removeEventListener("smart-tourist-reset-receptionist-dashboard", handleReset);
  }, []);

  // Filters state
  const [lockerStatusFilter, setLockerStatusFilter] = useState("all");
  const [historyFilterType, setHistoryFilterType] = useState<"all" | "day" | "month">("all");
  const [historyFilterValue, setHistoryFilterValue] = useState("");
  const [historyPhoneFilter, setHistoryPhoneFilter] = useState("");
  const [paymentFilterType, setPaymentFilterType] = useState<"all" | "day" | "month">("all");
  const [paymentFilterValue, setPaymentFilterValue] = useState("");
  const [paymentPhoneFilter, setPaymentPhoneFilter] = useState("");
  const [activePhoneFilter, setActivePhoneFilter] = useState("");

  const { data: dashboard, isLoading } = useGetSmartTouristReceptionistDashboard(receptionistId || "", {
    query: { 
      enabled: role === "receptionist" && !!receptionistId, 
      queryKey: getGetSmartTouristReceptionistDashboardQueryKey(receptionistId || ""),
      refetchInterval: 2000 
    }
  });

  const filteredLockers = useMemo(() => {
    if (!dashboard) return [];
    let result = [...dashboard.lockers].sort((a, b) => a.number - b.number);
    if (lockerStatusFilter !== "all") {
      result = result.filter(l => l.status === lockerStatusFilter);
    }
    return result;
  }, [dashboard, lockerStatusFilter]);

  const filteredHistory = useMemo(() => {
    if (!dashboard) return [];
    let history = (dashboard as any).history || []; 
    
    if (historyFilterType !== "all" && historyFilterValue) {
      history = history.filter((item: any) => {
        if (historyFilterType === "day") {
          return formatDateLocal(item.createdAt) === historyFilterValue;
        } else {
          return formatMonthLocal(item.createdAt) === historyFilterValue;
        }
      });
    }

    if (historyPhoneFilter) {
      history = history.filter((item: any) => (item.userPhone || "").includes(historyPhoneFilter));
    }

    return history;
  }, [dashboard, historyFilterType, historyFilterValue, historyPhoneFilter]);

  const filteredPayments = useMemo(() => {
    if (!dashboard) return [];
    let result = dashboard.payments;

    if (paymentFilterType !== "all" && paymentFilterValue) {
      result = result.filter((item: any) => {
        if (paymentFilterType === "day") {
          return formatDateLocal(item.createdAt) === paymentFilterValue;
        } else {
          return formatMonthLocal(item.createdAt) === paymentFilterValue;
        }
      });
    }

    if (paymentPhoneFilter) {
      result = result.filter((item: any) => (item.userPhone || "").includes(paymentPhoneFilter));
    }

    return result;
  }, [dashboard, paymentFilterType, paymentFilterValue, paymentPhoneFilter]);

  const filteredActive = useMemo(() => {
    if (!dashboard) return [];
    let result = (dashboard as any).activeBookings || [];
    if (activePhoneFilter) {
      result = result.filter((b: any) => b.userPhone?.includes(activePhoneFilter));
    }
    return result;
  }, [dashboard, activePhoneFilter]);

  useEffect(() => {
    if (role !== "receptionist" || !receptionistId) {
      setLocation("/");
    }
  }, [role, receptionistId, setLocation]);

  if (role !== "receptionist" || !receptionistId) {
    return null;
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-center">Dashboard not found.</div>;
  }

  const sidebarLinks = [
    { id: "lockers", label: "Locker Grid", icon: Box },
    { id: "queue", label: "Action Queue", icon: Clock },
    { id: "active", label: "Active Bookings", icon: Users },
    { id: "history", label: "Booking History", icon: History },
    { id: "payments", label: "Financials", icon: CreditCard },
    { id: "profile", label: "Profile", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 border-r border-white/40 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-3xl p-8 hidden xl:flex flex-col gap-12 shadow-2xl z-20"
      >
        <div className="space-y-2">
          <div className="px-4 mb-8">
            <h1 className="text-2xl font-black tracking-tighter">Station <span className="text-primary">Control</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Receptionist v3.0</p>
          </div>
          <div className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-500 group relative",
                    isActive 
                      ? "bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.02]" 
                      : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                    <span className="font-black text-sm tracking-tight uppercase tracking-widest">{link.label}</span>
                  </div>
                  {link.id === "queue" && dashboard.bookingQueue.length > 0 && (
                    <Badge variant={isActive ? "secondary" : "destructive"} className={cn("px-2 py-0 h-5 flex items-center justify-center rounded-full text-[10px] animate-pulse", isActive ? "bg-white text-primary" : "")}>
                      {dashboard.bookingQueue.length}
                    </Badge>
                  )}
                  {isActive && <motion.div layoutId="active-nav-glow" className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-8 rounded-[2rem] glass-card border-white/20 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black tracking-tight truncate">{receptionist?.name}</p>
              <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/20">{dashboard.station.name}</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-2xl font-black border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all shadow-xl" onClick={() => window.dispatchEvent(new CustomEvent("smart-tourist-logout"))}>
            <LogOut className="h-4 w-4 mr-2" /> EXIT SYSTEM
          </Button>
        </div>
      </motion.aside>

      <main className="flex-1 p-8 md:p-12 overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                {sidebarLinks.find(l => l.id === activeTab)?.label}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">
                <div className="w-8 h-1 bg-primary rounded-full" />
                Live Monitoring Node: {dashboard.station.id.toUpperCase()}
              </div>
            </motion.div>

            <div className="flex items-center gap-6 glass-card p-4 rounded-3xl border-white/40 shadow-xl">
              <div className="px-6 border-l border-white/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Station Lockers</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full animate-ping", dashboard.station.availableLockers > 0 ? "bg-emerald-500" : "bg-destructive")} />
                  <p className="text-sm font-black">{dashboard.station.availableLockers} Available</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
            {activeTab === "lockers" && (
              <motion.div
                key="lockers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                  <CardHeader className="p-12 border-b border-white/10 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter">Locker Grid</CardTitle>
                      <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Status of all {dashboard.station.totalLockers} lockers at this station.</CardDescription>
                    </div>
                    <Select value={lockerStatusFilter} onValueChange={setLockerStatusFilter}>
                      <SelectTrigger className="w-[180px] h-14 rounded-[1.5rem] bg-white/50 border-white/40 shadow-inner font-bold">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/20">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="occupied">In Use</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="p-12">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
                      {filteredLockers.map((locker: any) => (
                        <LockerItem key={locker.id} locker={locker} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "queue" && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                  <CardHeader className="p-12 border-b border-white/10">
                    <CardTitle className="text-3xl font-black tracking-tighter">Action Queue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-12">
                    {dashboard.bookingQueue.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <CheckCircle2 className="mx-auto h-16 w-16 opacity-20 mb-6" />
                        <p className="font-black uppercase tracking-[0.3em] text-sm">Queue is clear. No pending requests.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {dashboard.bookingQueue.map((booking: any) => (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <QueueItem booking={booking} receptionistId={receptionistId} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "active" && (
              <motion.div
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                  <CardHeader className="p-12 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter">Active Bookings</CardTitle>
                      <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Live terminals</CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Filter by phone..."
                        className="pl-14 h-16 rounded-[1.5rem] bg-white/50 border-white/40 shadow-inner font-bold"
                        value={activePhoneFilter}
                        onChange={e => setActivePhoneFilter(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/10">
                          <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">Locker #</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">User</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Phone</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Station</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Check-in</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Check-out</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-12 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActive.map((booking: any) => (
                          <TableRow key={booking.id} className="border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                            <TableCell className="px-12 py-10 font-black text-2xl tracking-tighter group-hover:text-primary transition-colors">#{booking.lockerNumber}</TableCell>
                            <TableCell className="font-black text-sm">{booking.userName}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground font-bold tracking-widest">{booking.userPhone}</TableCell>
                            <TableCell className="font-black text-xs uppercase tracking-tight">{booking.stationName}</TableCell>
                            <TableCell className="text-xs font-black">{formatDateTime(booking.checkInTime)}</TableCell>
                            <TableCell className="text-xs font-black">{formatDateTime(booking.checkOutTime)}</TableCell>
                            <TableCell className="font-black text-xl text-primary">৳{booking.totalAmount?.toFixed(2) || booking.amount?.toFixed(2)}</TableCell>
                            <TableCell className="px-12 text-right">
                              <Badge className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-lg bg-primary text-white shadow-primary/20">{booking.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredActive.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-black uppercase tracking-[0.3em]">No active bookings found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                  <CardHeader className="p-12 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter">Booking History</CardTitle>
                      <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">All past transactions and completed actions.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Filter phone..."
                          className="pl-14 h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold"
                          value={historyPhoneFilter}
                          onChange={e => setHistoryPhoneFilter(e.target.value)}
                        />
                      </div>
                      <Select value={historyFilterType} onValueChange={(v: any) => { setHistoryFilterType(v); setHistoryFilterValue(""); }}>
                        <SelectTrigger className="w-[180px] h-14 rounded-2xl bg-white/50 border-white/40 font-black text-[10px] uppercase tracking-widest">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20">
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="day">Specific Day</SelectItem>
                          <SelectItem value="month">Specific Month</SelectItem>
                        </SelectContent>
                      </Select>
                      {historyFilterType !== "all" && (
                        <Input 
                          type={historyFilterType === "day" ? "date" : "month"} 
                          className="w-[140px] h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold text-xs" 
                          value={historyFilterValue}
                          onChange={e => setHistoryFilterValue(e.target.value)}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/10">
                          <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">Locker #</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">User</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Phone</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Station</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Booking Date</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Check-in</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Check-out</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-12 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item: any) => (
                          <TableRow key={item.id} className="border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                            <TableCell className="px-12 py-10 font-black text-2xl tracking-tighter">#{item.lockerNumber}</TableCell>
                            <TableCell className="font-black text-sm">{item.userName}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground font-bold">{item.userPhone}</TableCell>
                            <TableCell className="font-black text-xs uppercase">{item.stationName}</TableCell>
                            <TableCell className="text-xs font-black tracking-tight">{formatDateTime(item.createdAt)}</TableCell>
                            <TableCell className="text-xs font-bold">{formatDateTime(item.checkInTime)}</TableCell>
                            <TableCell className="text-xs font-bold">{formatDateTime(item.checkOutTime)}</TableCell>
                            <TableCell className="font-black text-xl text-primary">৳{item.totalAmount?.toFixed(2) || item.amount?.toFixed(2)}</TableCell>
                            <TableCell className="px-12 text-right">
                              <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary">{item.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground font-black uppercase tracking-[0.3em]">No history records found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-5">
                  <Card 
                    className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative glass-card rounded-[2rem]", activePaymentTab === "all_transactions" ? "ring-2 ring-primary bg-primary/5 shadow-xl shadow-primary/20 scale-[1.02]" : "")}
                    onClick={() => setActivePaymentTab("all_transactions")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">All Transactions</CardTitle>
                      <History className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                      <div className="text-2xl font-bold text-primary">৳{dashboard.payments.reduce((sum: number, p: any) => sum + p.amount, 0).toFixed(0)}</div>
                    </CardContent>
                  </Card>
                  {/* Custom render for Fine and Refund metrics */}
                  {(() => {
                    const findMetric = (label: string) => dashboard.metrics.find((m: any) => m.label === label);
                    const fine40 = findMetric("40% fine total");
                    const refund40 = findMetric("40% refund total");
                    const fine80 = findMetric("80% / 100% fine total");
                    const refund80 = findMetric("80% / 100% refund total");
                    const success = findMetric("Successful booking total");
                    const due = findMetric("Due collected");

                    return (
                      <>
                        {/* 40% Group */}
                        <Card 
                          className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative glass-card rounded-[2rem]", activePaymentTab === "40%_penalty" ? "ring-2 ring-primary bg-primary/5 shadow-xl shadow-primary/20 scale-[1.02]" : "")}
                          onClick={() => setActivePaymentTab("40%_penalty")}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">40% Penalty & Refund</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
                          </CardHeader>
                          <CardContent className="flex flex-col items-start justify-center pt-1 pb-4">
                            <div className="text-xl font-bold text-destructive">-৳{fine40?.value.toFixed(0)}</div>
                            <div className="text-xl font-bold text-primary">+৳{refund40?.value.toFixed(0)}</div>
                          </CardContent>
                        </Card>

                        {/* 80/100% Group */}
                        <Card 
                          className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative glass-card rounded-[2rem]", activePaymentTab === "80%_penalty" ? "ring-2 ring-primary bg-primary/5 shadow-xl shadow-primary/20 scale-[1.02]" : "")}
                          onClick={() => setActivePaymentTab("80%_penalty")}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">80/100% Penalty & Refund</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
                          </CardHeader>
                          <CardContent className="flex flex-col items-start justify-center pt-1 pb-4">
                            <div className="text-xl font-bold text-destructive">-৳{fine80?.value.toFixed(0)}</div>
                            <div className="text-xl font-bold text-primary">+৳{refund80?.value.toFixed(0)}</div>
                          </CardContent>
                        </Card>

                        {/* Success Group */}
                        <Card 
                          className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative glass-card rounded-[2rem]", activePaymentTab === "successful_settlement" ? "ring-2 ring-primary bg-primary/5 shadow-xl shadow-primary/20 scale-[1.02]" : "")}
                          onClick={() => setActivePaymentTab("successful_settlement")}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Successful Settlements</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-muted-foreground/40" />
                          </CardHeader>
                          <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                            <div className="text-2xl font-bold">৳{success?.value.toFixed(0)}</div>
                          </CardContent>
                        </Card>

                        {/* Due Group */}
                        <Card 
                          className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative glass-card rounded-[2rem]", activePaymentTab === "due_payment" ? "ring-2 ring-primary bg-primary/5 shadow-xl shadow-primary/20 scale-[1.02]" : "")}
                          onClick={() => setActivePaymentTab("due_payment")}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Collected</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground/40" />
                          </CardHeader>
                          <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                            <div className="text-2xl font-bold">৳{due?.value.toFixed(0)}</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                  <CardHeader className="p-12 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter">
                        {activePaymentTab === "all_transactions" ? "All Financial Transactions" :
                         activePaymentTab === "40%_penalty" ? "40% Penalty & Refund Records" :
                         activePaymentTab === "80%_penalty" ? "80% / 100% Penalty & Refund Records" :
                         activePaymentTab === "successful_settlement" ? "Successful Settlements" :
                         "Due Collected Records"}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Detailed transaction history for the selected category.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {activePaymentTab === "all_transactions" && (
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Phone number..."
                            className="pl-14 h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold"
                            value={paymentPhoneFilter}
                            onChange={e => setPaymentPhoneFilter(e.target.value)}
                          />
                        </div>
                      )}
                      <Select value={paymentFilterType} onValueChange={(v: any) => { setPaymentFilterType(v); setPaymentFilterValue(""); }}>
                        <SelectTrigger className="w-[180px] h-14 rounded-2xl bg-white/50 border-white/40 font-black text-[10px] uppercase tracking-widest">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20">
                          <SelectItem value="all">All Records</SelectItem>
                          <SelectItem value="day">Specific Day</SelectItem>
                          <SelectItem value="month">Specific Month</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentFilterType !== "all" && (
                        <Input 
                          type={paymentFilterType === "day" ? "date" : "month"} 
                          className="w-[140px] h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold text-xs" 
                          value={paymentFilterValue}
                          onChange={e => setPaymentFilterValue(e.target.value)}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/10">
                          {activePaymentTab === "all_transactions" && <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">Type</TableHead>}
                          <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">User</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Phone</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Locker #</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Station</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Reason</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest">Date</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest px-12 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments
                          .filter((p: any) => {
                            if (activePaymentTab === "all_transactions") return true;
                            if (activePaymentTab === "successful_settlement") {
                              return p.type === "successful_settlement" || p.type === "booking_payment";
                            }
                            if (activePaymentTab === "40%_penalty") {
                              return p.type === "40%_penalty" || (p.type === "refund" && p.reason?.includes("40"));
                            }
                            if (activePaymentTab === "80%_penalty") {
                              return p.type === "80%_penalty" || p.type === "100%_penalty" || (p.type === "refund" && (p.reason?.includes("80") || p.reason?.includes("100")));
                            }
                            return p.type === activePaymentTab;
                          })
                          .map((payment: any) => (
                            <TableRow key={payment.id} className="border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                              {activePaymentTab === "all_transactions" && (
                                <TableCell className="px-12 text-xs font-black uppercase text-muted-foreground tracking-widest">
                                  {payment.type.replace(/_/g, ' ')}
                                </TableCell>
                              )}
                            <TableCell className={cn("text-xs font-bold", activePaymentTab !== "all_transactions" ? "px-12" : "")}>{(payment as any).userName}</TableCell>
                              <TableCell className="text-[10px] font-bold text-muted-foreground tracking-widest">{(payment as any).userPhone}</TableCell>
                              <TableCell className="text-xl font-black tracking-tighter">#{(payment as any).lockerNumber}</TableCell>
                              <TableCell className="text-xs font-black uppercase">{(payment as any).stationName}</TableCell>
                              <TableCell className="text-xs font-medium">{payment.reason}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatDateTime(payment.createdAt)}</TableCell>
                              <TableCell className="px-12 text-right font-black text-xl text-primary">৳{payment.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        {filteredPayments.filter((p: any) => {
                          if (activePaymentTab === "all_transactions") return true;
                          if (activePaymentTab === "successful_settlement") {
                            return p.type === "successful_settlement" || p.type === "booking_payment";
                          }
                          if (activePaymentTab === "40%_penalty") {
                            return p.type === "40%_penalty" || (p.type === "refund" && p.reason?.includes("40"));
                          }
                          if (activePaymentTab === "80%_penalty") {
                            return p.type === "80%_penalty" || p.type === "100%_penalty" || (p.type === "refund" && (p.reason?.includes("80") || p.reason?.includes("100")));
                          }
                          return p.type === activePaymentTab;
                        }).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={activePaymentTab === "all_transactions" ? 8 : 7} className="text-center py-12 text-muted-foreground font-black uppercase tracking-[0.3em]">No records found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                        <TableRow className="border-white/10">
                          <TableCell colSpan={activePaymentTab === "all_transactions" ? 7 : 6} className="px-12 py-8 font-black text-xl uppercase tracking-widest">Total Income</TableCell>
                          <TableCell className="px-12 text-right font-black text-3xl text-primary">
                            ৳{filteredPayments
                              .reduce((sum: number, p: any) => {
                                if (activePaymentTab === "all_transactions") return sum + p.amount;
                                if (activePaymentTab === "successful_settlement") {
                                  if (p.type === "successful_settlement" || p.type === "booking_payment") return sum + p.amount;
                                }
                                if (activePaymentTab === "80%_penalty") {
                                  if (p.type === "80%_penalty" || p.type === "100%_penalty") return sum + p.amount;
                                }
                                if (p.type === activePaymentTab) return sum + p.amount;
                                return sum;
                              }, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="max-w-2xl glass-card rounded-[3.5rem] shadow-2xl border-white/20">
                  <CardHeader className="p-12 border-b border-white/10">
                    <CardTitle className="text-3xl font-black tracking-tighter">Profile Settings</CardTitle>
                    <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Manage your account information and password.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-12">
                    <form className="space-y-8" onSubmit={handleUpdateProfile}>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</Label>
                          <Input value={receptionist?.name || ""} readOnly className="h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold" />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Employee ID</Label>
                          <Input value={receptionistId || ""} readOnly className="h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold" />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Station Assignment</Label>
                          <Input value={dashboard.station.name || ""} readOnly className="h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold" />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                          <Input 
                            value={profilePhone} 
                            onChange={(e) => setProfilePhone(e.target.value)} 
                            placeholder="Add your phone number" 
                            className="h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div className="space-y-3 col-span-2">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Change Password</Label>
                          <Input 
                            type="password" 
                            value={profilePassword} 
                            onChange={(e) => setProfilePassword(e.target.value)} 
                            placeholder="Enter new password" 
                            minLength={6}
                            className="h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isUpdating} className="h-14 rounded-2xl px-8 font-black tracking-widest uppercase shadow-xl w-full sm:w-auto">
                        {isUpdating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Update Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function QueueItem({ booking, receptionistId }: { booking: Booking, receptionistId: string }) {
  const receptionistAction = useSmartTouristReceptionistAction();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAction = (action: "confirm_key_issue" | "confirm_key_receipt" | "confirm_due_payment") => {
    receptionistAction.mutate({
      receptionistId,
      bookingId: booking.id,
      data: {
        receptionistId,
        bookingId: booking.id,
        action
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Action Confirmed",
          description: `Successfully processed ${action.replace(/_/g, " ")}.` 
        });
        queryClient.invalidateQueries({ queryKey: getGetSmartTouristReceptionistDashboardQueryKey(receptionistId) });
      },
      onError: (err: any) => {
        toast({ title: "Action Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={
            booking.status === "key_requested" ? "default" : 
            booking.status === "return_requested" ? "secondary" : "destructive"
          }>
            {booking.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
          <span className="font-bold text-lg">Locker {booking.lockerNumber}</span>
        </div>
        <p className="text-sm">
          <span className="font-medium">{booking.userName}</span>
          <span className="text-muted-foreground ml-2">({booking.userPhone})</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Station: <span className="font-medium text-foreground">{booking.stationName}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Check-in: {formatDateTime(booking.checkInTime)} | Check-out: {formatDateTime(booking.checkOutTime)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Duration: <span className="font-medium text-foreground">{booking.durationHours} hrs</span> | Total: <span className="font-bold text-primary">৳{booking.totalAmount?.toFixed(2) || booking.amount?.toFixed(2)}</span>
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {booking.status === "key_requested" && (
          <Button onClick={() => handleAction("confirm_key_issue")} disabled={receptionistAction.isPending}>
            <Key className="mr-2 h-4 w-4" /> Issue Key
          </Button>
        )}
        {booking.status === "return_requested" && (
          <div className="flex flex-col gap-2">
            {booking.dueAmount > 0 && (
              <Badge variant="destructive" className="justify-center py-1">
                <AlertCircle className="mr-1 h-3 w-3" /> Due Pending: ৳{booking.dueAmount.toFixed(2)}
              </Badge>
            )}
            <Button 
              onClick={() => handleAction("confirm_key_receipt")} 
              disabled={receptionistAction.isPending || booking.dueAmount > 0}
              className={booking.dueAmount > 0 ? "opacity-50" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Confirm Key Receipt
            </Button>
          </div>
        )}
        {booking.status === "overdue_due" && (
          <Button variant="destructive" onClick={() => handleAction("confirm_due_payment")} disabled={receptionistAction.isPending}>
            <CreditCard className="mr-2 h-4 w-4" /> Collect ৳{booking.dueAmount.toFixed(2)}
          </Button>
        )}
      </div>
    </div>
  );
}

function LockerItem({ locker }: { locker: Locker }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case "available": return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "booked": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "occupied": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center text-center h-28 shadow-sm transition-colors duration-300 ${getStatusColor(locker.status)}`}
    >
      <span className="text-3xl font-black mb-1">{locker.number}</span>
      <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">{locker.status}</span>
    </motion.div>
  );
}