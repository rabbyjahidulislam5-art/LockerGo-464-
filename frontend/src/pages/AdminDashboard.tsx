import { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { 
  useGetSmartTouristAdminDashboard, 
  getGetSmartTouristAdminDashboardQueryKey,
  useGetSmartTouristBootstrap
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Users, 
  CreditCard, 
  History, 
  Search, 
  Calendar, 
  LayoutDashboard, 
  ClipboardList, 
  UserCircle,
  LogOut,
  Activity,
  CheckCircle2,
  Box,
  Filter,
  Star,
  Trash2,
  MessageSquare,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn, useRealtime, formatDateLocal, formatMonthLocal } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background animate-pulse">
      <div className="w-80 border-r border-primary/5 p-8 space-y-8">
        <div className="h-10 w-48 bg-muted rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 w-full bg-muted rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-12 space-y-12">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-12 w-64 bg-muted rounded-2xl" />
            <div className="h-4 w-48 bg-muted rounded-lg" />
          </div>
          <div className="h-12 w-48 bg-muted rounded-xl" />
        </div>
        <div className="grid gap-6 grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-muted rounded-[2.5rem]" />
          ))}
        </div>
        <div className="h-[400px] bg-muted/50 rounded-[3rem]" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { role, adminName } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeBookingSubTab, setActiveBookingSubTab] = useState<"active" | "history">("active");
  const [activePaymentTab, setActivePaymentTab] = useState<string>("all_transactions");
  const [activeAuditTab, setActiveAuditTab] = useState<"staff" | "booking" | "payment" | "review">("staff");

  const [activePhoneFilter, setActivePhoneFilter] = useState("");
  const [historyPhoneFilter, setHistoryPhoneFilter] = useState("");
  const [historyFilterType, setHistoryFilterType] = useState<"all" | "day" | "month">("all");
  const [historyFilterValue, setHistoryFilterValue] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyStationFilter, setHistoryStationFilter] = useState("all");
  const [activeFilterType, setActiveFilterType] = useState<"all" | "day" | "month">("all");
  const [activeFilterValue, setActiveFilterValue] = useState("");
  const [activeStationFilter, setActiveStationFilter] = useState("all");
  
  const [staffNameFilter, setStaffNameFilter] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<"all" | "admin" | "receptionist" | "user">("all");
  const [staffDayFilter, setStaffDayFilter] = useState("");
  const [staffMonthFilter, setStaffMonthFilter] = useState("");
  const [staffEmailFilter, setStaffEmailFilter] = useState("");
  const [staffPhoneFilter, setStaffPhoneFilter] = useState("");
  const [staffAddressFilter, setStaffAddressFilter] = useState("");
  
  const [bookingLockerIdFilter, setBookingLockerIdFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingUserPhoneFilter, setBookingUserPhoneFilter] = useState("");
  const [pulseFilter, setPulseFilter] = useState<"week" | "month">("month");

  const [bookingDayFilter, setBookingDayFilter] = useState("");
  const [bookingMonthFilter, setBookingMonthFilter] = useState("");
  const [bookingStationFilter, setBookingStationFilter] = useState("all");
  const [bookingActorRoleFilter, setBookingActorRoleFilter] = useState("all");

  const [reviewDayFilter, setReviewDayFilter] = useState("");
  const [reviewMonthFilter, setReviewMonthFilter] = useState("");

  const [paymentPhoneFilter, setPaymentPhoneFilter] = useState("");
  const [paymentFilterType, setPaymentFilterType] = useState<"all" | "day" | "month">("all");
  const [paymentFilterValue, setPaymentFilterValue] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [paymentUserPhoneFilter, setPaymentUserPhoneFilter] = useState("");
  const [paymentLockerFilter, setPaymentLockerFilter] = useState("");
  const [paymentStationFilter, setPaymentStationFilter] = useState("all");
  const [paymentDayFilter, setPaymentDayFilter] = useState("");
  const [paymentMonthFilter, setPaymentMonthFilter] = useState("");

  const { data: dashboard, isLoading: dashLoading } = useGetSmartTouristAdminDashboard({
    query: {
      refetchInterval: 3000,
    }
  });
  
  useRealtime(() => {
    queryClient.invalidateQueries({ queryKey: getGetSmartTouristAdminDashboardQueryKey() });
  });

  const { data: bootstrapData } = useGetSmartTouristBootstrap();
  const stations = bootstrapData?.stations || [];



  const filteredActive = useMemo(() => {
    if (!dashboard) return [];
    const activeStatuses = ["active", "pending"];
    let result = dashboard.bookings.filter(b => activeStatuses.includes(b.status));
    if (activePhoneFilter) {
      result = result.filter(b => (b.userPhone || "").includes(activePhoneFilter));
    }
    if (activeFilterType !== "all" && activeFilterValue) {
      result = result.filter(item => {
        if (activeFilterType === "day") return formatDateLocal(item.createdAt) === activeFilterValue;
        return formatMonthLocal(item.createdAt) === activeFilterValue;
      });
    }
    // Sorting: newest first
    return [...result].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [dashboard, activePhoneFilter, activeFilterType, activeFilterValue]);

  const filteredHistory = useMemo(() => {
    if (!dashboard) return [];
    let result = [...dashboard.bookings];
    
    if (historyFilterType !== "all" && historyFilterValue) {
      result = result.filter(item => {
        if (historyFilterType === "day") return formatDateLocal(item.createdAt) === historyFilterValue;
        return formatMonthLocal(item.createdAt) === historyFilterValue;
      });
    }
    if (historyPhoneFilter) {
      result = result.filter((item: any) => (item.userPhone || "").includes(historyPhoneFilter));
    }
    if (historyStatusFilter !== "all") {
      result = result.filter(b => b.status === historyStatusFilter);
    }
    // Sort newest first
    return result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [dashboard, historyFilterType, historyFilterValue, historyPhoneFilter, historyStatusFilter]);

  const filteredPayments = useMemo(() => {
    if (!dashboard) return [];
    let result = dashboard.payments;
    if (activePaymentTab !== "all_transactions") {
      result = result.filter(p => {
        if (activePaymentTab === "successful_settlement") return p.type === "successful_settlement" || p.type === "booking_payment";
        if (activePaymentTab === "40%_penalty") return p.type === "40%_penalty" || (p.type === "refund" && p.reason?.includes("40"));
        if (activePaymentTab === "80%_penalty") return p.type === "80%_penalty" || p.type === "100%_penalty" || (p.type === "refund" && (p.reason?.includes("80") || p.reason?.includes("100")));
        return p.type === activePaymentTab;
      });
    }
    if (paymentFilterType !== "all" && paymentFilterValue) {
      result = result.filter(item => {
        const date = new Date(item.createdAt);
        if (paymentFilterType === "day") return formatDateLocal(item.createdAt) === paymentFilterValue;
        return formatMonthLocal(item.createdAt) === paymentFilterValue;
      });
    }
    if (paymentPhoneFilter) {
      result = result.filter((item: any) => (item.userPhone || "").includes(paymentPhoneFilter));
    }
    return result;
  }, [dashboard, activePaymentTab, paymentFilterType, paymentFilterValue, paymentPhoneFilter]);

  const enrichedAuditLogs = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.auditLogs.map(log => {
      let actorEmail = "";
      let actorPhone = "";
      let actorAddress = "";
      let userPhone = "";
      let lockerNumber = "";
      let stationName = "";
      let stationId = log.stationId || "";

      // 1. Try to find details from memory based on IDs
      if (log.entityType === "user" || (log.entityType === "session" && log.actorRole === "user")) {
        const user = dashboard.users.find(u => u.id === log.entityId);
        if (user) {
          actorEmail = user.email || "";
          actorPhone = user.phone || "";
          actorAddress = user.address || "";
          userPhone = user.phone || "";
        }
      } else if (log.entityType === "receptionist" || (log.entityType === "session" && log.actorRole === "receptionist")) {
        const rec = dashboard.receptionists.find(r => r.id === log.entityId);
        if (rec) {
          actorEmail = rec.email || "";
          actorPhone = (rec as any).phone || "";
          stationId = stationId || rec.stationId || "";
        }
      } else if (log.entityType === "booking") {
        const b = dashboard.bookings.find(item => item.id === log.entityId);
        if (b) {
          userPhone = b.userPhone || "";
          lockerNumber = b.lockerNumber?.toString() || "";
          stationName = b.stationName || "";
          stationId = stationId || b.stationId || "";
        }
      }

      // 2. Deep enrichment from JSON (important for immutable history or deleted entities)
      try {
        const newVal = JSON.parse(log.newValue || "{}");
        const prevVal = JSON.parse(log.previousValue || "{}");
        const target = (newVal && typeof newVal === 'object' && Object.keys(newVal).length > 0) ? newVal : prevVal;
        
        if (target && typeof target === 'object') {
          actorEmail = actorEmail || target.email || target.userEmail || target.actorEmail || "";
          actorPhone = actorPhone || target.phone || target.userPhone || target.actorPhone || "";
          actorAddress = actorAddress || target.address || target.userAddress || target.actorAddress || "";
          userPhone = userPhone || target.userPhone || target.phone || "";
          lockerNumber = lockerNumber || target.lockerNumber?.toString() || target.number?.toString() || "";
          stationName = stationName || target.stationName || "";
          stationId = stationId || target.stationId || "";
        }
      } catch {}

      return {
        ...log,
        actorEmail,
        actorPhone,
        actorAddress,
        userPhone,
        lockerNumber,
        stationName,
        stationId
      };
    });
  }, [dashboard]);

  const filteredStaffAudit = useMemo(() => {
    let result = enrichedAuditLogs.filter(log => {
      const entity = String(log.entityType || '').toLowerCase();
      const action = String(log.actionType || '').toLowerCase();
      return ["user", "receptionist"].includes(entity) || ["login", "logout", "registration", "profile_update"].includes(action);
    });
    if (staffRoleFilter !== "all") result = result.filter(log => log.actorRole === staffRoleFilter);
    if (staffNameFilter) result = result.filter(log => (log.actorName || "").toLowerCase().includes(staffNameFilter.toLowerCase()));
    if (staffDayFilter) result = result.filter(log => formatDateLocal(log.createdAt) === staffDayFilter);
    if (staffMonthFilter) result = result.filter(log => formatMonthLocal(log.createdAt) === staffMonthFilter);
    if (staffEmailFilter) result = result.filter(log => (log.actorEmail || "").toLowerCase().includes(staffEmailFilter.toLowerCase()));
    if (staffPhoneFilter) result = result.filter(log => (log.actorPhone || "").includes(staffPhoneFilter));
    if (staffAddressFilter) result = result.filter(log => (log.actorAddress || "").toLowerCase().includes(staffAddressFilter.toLowerCase()));
    return result;
  }, [enrichedAuditLogs, staffRoleFilter, staffNameFilter, staffDayFilter, staffMonthFilter, staffEmailFilter, staffPhoneFilter, staffAddressFilter]);

  const filteredBookingAudit = useMemo(() => {
    let result = enrichedAuditLogs.filter(log => log.entityType === "booking");
    if (bookingLockerIdFilter) {
      result = result.filter(log => (log.lockerNumber || "").toString() === bookingLockerIdFilter);
    }
    if (bookingStatusFilter !== "all") {
      result = result.filter(log => {
        try { return JSON.parse(log.newValue)?.status === bookingStatusFilter; } catch { return false; }
      });
    }
    if (bookingDayFilter) result = result.filter(log => formatDateLocal(log.createdAt) === bookingDayFilter);
    if (bookingMonthFilter) result = result.filter(log => formatMonthLocal(log.createdAt) === bookingMonthFilter);
    if (bookingUserPhoneFilter) {
      result = result.filter(log => (log.userPhone || "").includes(bookingUserPhoneFilter));
    }
    if (bookingStationFilter !== "all") {
      result = result.filter(log => log.stationId === bookingStationFilter);
    }
    if (bookingActorRoleFilter !== "all") {
      result = result.filter(log => log.actorRole === bookingActorRoleFilter);
    }
    return result;
  }, [enrichedAuditLogs, bookingLockerIdFilter, bookingStatusFilter, bookingDayFilter, bookingMonthFilter, bookingUserPhoneFilter, bookingStationFilter, bookingActorRoleFilter]);

  const filteredPaymentAudit = useMemo(() => {
    let result = enrichedAuditLogs.filter(log => {
      const actionStr = (log.action || log.actionType || '').toLowerCase();
      return actionStr.includes('payment') || actionStr.includes('penalty') || actionStr.includes('refund') || actionStr.includes('settlement');
    });
    if (paymentTypeFilter !== "all") {
      result = result.filter(log => {
        const actionStr = (log.action || log.actionType || '').toLowerCase().replace(/_/g, ' ').replace(/%/g, '');
        const logContent = (log.newValue || '').toLowerCase();
        
        if (paymentTypeFilter === "40_penalty") {
          return actionStr.includes("40 penalty") || (actionStr.includes("refund") && /40\s*%/.test(logContent));
        }
        
        if (paymentTypeFilter === "80_penalty") {
          return actionStr.includes("80 penalty") || actionStr.includes("100 penalty") || 
                 (actionStr.includes("refund") && (/(80|100)\s*%/.test(logContent)));
        }
        
        const filterStr = paymentTypeFilter.toLowerCase().replace(/_/g, ' ').replace(/%/g, '');
        return actionStr.includes(filterStr);
      });
    }
    if (paymentUserPhoneFilter) {
      result = result.filter(log => (log.userPhone || "").includes(paymentUserPhoneFilter));
    }
    if (paymentLockerFilter) {
      result = result.filter(log => (log.lockerNumber || "").toString() === paymentLockerFilter);
    }
    if (paymentStationFilter !== "all") {
      result = result.filter(log => log.stationId === paymentStationFilter);
    }
    if (paymentDayFilter) result = result.filter(log => formatDateLocal(log.createdAt) === paymentDayFilter);
    if (paymentMonthFilter) result = result.filter(log => formatMonthLocal(log.createdAt) === paymentMonthFilter);
    return result;
  }, [enrichedAuditLogs, paymentTypeFilter, paymentUserPhoneFilter, paymentLockerFilter, paymentStationFilter, paymentDayFilter, paymentMonthFilter]);

  const filteredReviewAudit = useMemo(() => {
    let result = enrichedAuditLogs.filter(log => log.entityType === "review");
    if (reviewDayFilter) result = result.filter(log => formatDateLocal(log.createdAt) === reviewDayFilter);
    if (reviewMonthFilter) result = result.filter(log => formatMonthLocal(log.createdAt) === reviewMonthFilter);
    return result;
  }, [enrichedAuditLogs, reviewDayFilter, reviewMonthFilter]);

  useEffect(() => {
    if (role !== "admin" || !adminName) setLocation("/");
  }, [role, adminName, setLocation]);

  if (role !== "admin" || !adminName) return null;
  if (dashLoading || !dashboard || !dashboard.bookings || !dashboard.payments) return <DashboardSkeleton />;

  const getActionText = (log: any) => {
    const action = log.actionType || log.action || '';
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const renderState = (state: string) => {
    const value = state?.toString()?.trim();
    if (!value || value.toLowerCase() === 'none') return <Badge variant="outline" className="opacity-40 italic">Initial</Badge>;
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'object') {
        return (
          <div className="space-y-1 bg-muted/20 p-2 rounded-lg border border-white/10">
            {Object.entries(obj).slice(0, 4).map(([k, v]) => (
              <div key={k} className="text-[10px] flex justify-between gap-4">
                <span className="font-black uppercase tracking-widest text-muted-foreground">{k}:</span>
                <span className="font-bold truncate max-w-[100px]">{String(v)}</span>
              </div>
            ))}
          </div>
        );
      }
    } catch { return <span className="text-[10px] font-mono">{value}</span>; }
    return null;
  };

  const stats = [
    { label: "Bookings", value: dashboard?.bookings?.length || 0, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+8%" },
    { label: "Travelers", value: dashboard?.users?.length || 0, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "+12%" },
    { label: "Revenue", value: `৳${(dashboard?.payments || []).reduce((acc, p) => acc + (p.type?.includes('penalty') ? 0 : (p.amount || 0)), 0).toLocaleString()}`, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+15%" },
    { label: "Security Logs", value: dashboard?.auditLogs?.length || 0, icon: History, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Live" },
  ];

  const sidebarLinks = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Operations", icon: ClipboardList },
    { id: "users", label: "Staff & Users", icon: Users },
    { id: "payments", label: "Financials", icon: CreditCard },
    { id: "audit", label: "Audit Engine", icon: History },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 border-r border-white/40 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-3xl p-8 hidden xl:flex flex-col gap-6 shadow-2xl z-20"
      >
        <div className="space-y-2">
          <div className="px-4 mb-4">
            <h1 className="text-2xl font-black tracking-tighter">Command <span className="text-primary">Center</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Admin v3.0 Pro Max</p>
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
                    "w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 group relative",
                    isActive 
                      ? "bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.02]" 
                      : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                  <span className="font-black text-sm tracking-tight uppercase tracking-widest">{link.label}</span>
                  {isActive && <motion.div layoutId="active-nav-glow" className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-8 rounded-[2rem] glass-card border-white/20 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">{adminName}</p>
              <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/20">System Root</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-2xl font-black border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all shadow-xl" onClick={() => setLocation("/")}>
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
                Live Monitoring Node: Alpha-7
              </div>
            </motion.div>

            <div className="flex items-center gap-6 glass-card p-4 rounded-3xl border-white/40 shadow-xl">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-lg hover:z-10 transition-transform hover:scale-110">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 555}`} alt="Staff" />
                  </div>
                ))}
              </div>
              <div className="px-6 border-l border-white/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Staff</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-sm font-black">12 Terminals</p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                      <Card className="group overflow-hidden border-none shadow-2xl hover:shadow-primary/10 transition-all duration-700 rounded-[3rem] glass-card">
                        <CardContent className="p-10">
                          <div className="flex items-start justify-between mb-10">
                            <div className={cn("p-5 rounded-[1.5rem] transition-transform group-hover:rotate-12 duration-700 shadow-xl", stat.bg)}>
                              <stat.icon className={cn("h-8 w-8", stat.color)} />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3">{stat.trend}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <p className="text-5xl font-black tracking-tighter">{stat.value}</p>
                          </div>
                          <div className="mt-8 h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className={cn("h-full rounded-full", stat.color.replace('text', 'bg'))} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <Card className="lg:col-span-2 glass-card rounded-[3.5rem] p-12 border-white/20">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-3xl font-black tracking-tighter">System Pulse</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant={pulseFilter === "week" ? "outline" : "ghost"} 
                          size="sm" 
                          className={cn("rounded-xl font-black text-[10px] uppercase", pulseFilter === "week" && "bg-white/50")}
                          onClick={() => setPulseFilter("week")}
                        >
                          Week
                        </Button>
                        <Button 
                          variant={pulseFilter === "month" ? "outline" : "ghost"} 
                          size="sm" 
                          className={cn("rounded-xl font-black text-[10px] uppercase", pulseFilter === "month" && "bg-white/50")}
                          onClick={() => setPulseFilter("month")}
                        >
                          Month
                        </Button>
                      </div>
                    </div>
                    <div className="h-[400px] w-full bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem] border border-white/10 overflow-hidden relative p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(dashboard as any)?.pulse?.[pulseFilter] || []}>
                          <defs>
                            <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold'}}
                            minTickGap={30}
                          />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#pulseGradient)" 
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>


                  <Card className="glass-card rounded-[3.5rem] p-12 border-white/20">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-2xl font-black tracking-tighter">Event Stream</h3>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10"><History className="h-5 w-5" /></Button>
                    </div>
                    <div className="space-y-6">
                      {dashboard.auditLogs.slice(0, 6).map((log, i) => (
                        <div key={log.id} className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-white/40 dark:hover:bg-white/5 transition-all border border-transparent hover:border-white/40 group">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-lg border border-primary/10 group-hover:scale-110 transition-transform">
                            {log.actorName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate">{log.actionType.replace(/_/g, ' ').toUpperCase()}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-medium">By {log.actorName} • {new Date(log.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div key="bookings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <div className="flex gap-4 p-2 glass-card w-fit rounded-3xl border-white/40">
                  <Button variant={activeBookingSubTab === "active" ? "default" : "ghost"} onClick={() => setActiveBookingSubTab("active")} className="rounded-2xl font-black text-xs uppercase px-8">Active Operations</Button>
                  <Button variant={activeBookingSubTab === "history" ? "default" : "ghost"} onClick={() => setActiveBookingSubTab("history")} className="rounded-2xl font-black text-xs uppercase px-8">Booking History</Button>
                </div>

                {activeBookingSubTab === "active" ? (
                  <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                    <CardHeader className="p-12 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                        <CardTitle className="text-3xl font-black tracking-tighter">Live Monitor</CardTitle>
                        <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Real-time terminal synchronization</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="Filter phone..." className="pl-14 h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold" value={activePhoneFilter} onChange={e => setActivePhoneFilter(e.target.value)} />
                        </div>

                        <Select value={activeFilterType} onValueChange={(v: any) => { setActiveFilterType(v); setActiveFilterValue(""); }}>
                          <SelectTrigger className="w-[160px] h-14 rounded-2xl bg-white/50 border-white/40 font-black text-[10px] uppercase tracking-widest">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/20">
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="day">Day View</SelectItem>
                            <SelectItem value="month">Month View</SelectItem>
                          </SelectContent>
                        </Select>
                        {activeFilterType !== "all" && (
                          <Input 
                            type={activeFilterType === "day" ? "date" : "month"} 
                            className="w-[160px] h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold text-xs" 
                            value={activeFilterValue}
                            onChange={e => setActiveFilterValue(e.target.value)}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                          <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">Locker</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Traveler</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Terminal</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Chronology</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Value</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest px-12 text-right">State</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredActive.map((booking: any) => (
                            <TableRow key={booking.id} className="border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                              <TableCell className="px-12 py-10 font-black text-2xl tracking-tighter group-hover:text-primary transition-colors">#{booking.lockerNumber}</TableCell>
                              <TableCell>
                                <div className="font-black text-sm">{booking.userName}</div>
                                <div className="text-[10px] text-muted-foreground font-bold tracking-widest">{booking.userPhone}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-black text-sm uppercase tracking-tight">{booking.stationName}</div>
                                <div className="text-[10px] text-muted-foreground font-medium">{booking.destinationName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs font-black">IN: {new Date(booking.checkInTime).toLocaleString()}</div>
                                <div className="text-[10px] text-muted-foreground font-medium">EXP: {new Date(booking.checkOutTime).toLocaleString()}</div>
                              </TableCell>
                              <TableCell className="font-black text-xl text-primary">৳{booking.amount?.toFixed(2)}</TableCell>
                              <TableCell className="px-12 text-right">
                                <Badge className={cn(
                                  "rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-lg",
                                  booking.status === "active" ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-white shadow-primary/20"
                                )}>{booking.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredActive.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-64 text-center text-muted-foreground font-black uppercase tracking-[0.3em]">No active nodes found</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card rounded-[3.5rem] border-white/20 overflow-hidden shadow-2xl">
                    <CardHeader className="p-12 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                        <CardTitle className="text-3xl font-black tracking-tighter">Forensic History</CardTitle>
                        <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mt-1">Immutable transaction archive</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="Filter phone..." className="pl-14 h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold" value={historyPhoneFilter} onChange={e => setHistoryPhoneFilter(e.target.value)} />
                        </div>

                        <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                          <SelectTrigger className="w-[140px] h-14 rounded-2xl bg-white/50 border-white/40 font-black text-[10px] uppercase tracking-widest">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/20">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={historyFilterType} onValueChange={(v: any) => { setHistoryFilterType(v); setHistoryFilterValue(""); }}>
                          <SelectTrigger className="w-[150px] h-14 rounded-2xl bg-white/50 border-white/40 font-black text-[10px] uppercase tracking-widest">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/20">
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="day">Day View</SelectItem>
                            <SelectItem value="month">Month View</SelectItem>
                          </SelectContent>
                        </Select>
                        {historyFilterType !== "all" && (
                          <Input 
                            type={historyFilterType === "day" ? "date" : "month"} 
                            className="w-[180px] h-14 rounded-2xl bg-white/50 border-white/40 shadow-inner font-bold text-xs" 
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
                            <TableHead className="px-12 py-8 font-black text-[10px] uppercase tracking-widest">Locker</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Traveler</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Station</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Archive Date</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Settlement</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest px-12 text-right">Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredHistory.map((item: any) => (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                              <TableCell className="px-12 py-10 font-black text-2xl tracking-tighter">#{item.lockerNumber}</TableCell>
                              <TableCell>
                                <div className="font-black text-sm">{item.userName}</div>
                                <div className="text-[10px] text-muted-foreground font-bold">{item.userPhone}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-black text-xs uppercase">{item.stationName}</div>
                                <div className="text-[10px] text-muted-foreground">{item.destinationName}</div>
                              </TableCell>
                              <TableCell className="text-xs font-black uppercase tracking-tight">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="font-black text-xl">৳{item.amount?.toFixed(2)}</TableCell>
                              <TableCell className="px-12 text-right">
                                <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary">{item.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

        {activeTab === "users" && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Registered Travelers ({dashboard.users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">{u.phone}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Station Receptionists ({dashboard.receptionists.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Station Assignment</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.receptionists.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">{r.stationName}</div>
                          <div className="text-[10px] text-muted-foreground">{r.id}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.email}</TableCell>
                      </TableRow>
                    ))}
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
            className="space-y-6"
          >
            {/* Financial Sub-navigation Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activePaymentTab === "all_transactions" ? "ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]" : ""}`}
                onClick={() => setActivePaymentTab("all_transactions")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">All Transactions</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                  <div className="text-xl font-bold">৳{dashboard.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activePaymentTab === "40%_penalty" ? "ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]" : ""}`}
                onClick={() => setActivePaymentTab("40%_penalty")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">40% Penalty & Refund</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="flex flex-col items-start justify-center pt-1 pb-4">
                  <div className="text-sm font-bold text-destructive">-৳{dashboard.payments.filter(p => p.type === "40%_penalty").reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                  <div className="text-sm font-bold text-primary">+৳{dashboard.payments.filter(p => p.type === "refund" && p.reason?.includes("40")).reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activePaymentTab === "80%_penalty" ? "ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]" : ""}`}
                onClick={() => setActivePaymentTab("80%_penalty")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">80/100% Penalty & Refund</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="flex flex-col items-start justify-center pt-1 pb-4">
                  <div className="text-sm font-bold text-destructive">-৳{dashboard.payments.filter(p => p.type === "80%_penalty" || p.type === "100%_penalty").reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                  <div className="text-sm font-bold text-primary">+৳{dashboard.payments.filter(p => p.type === "refund" && (p.reason?.includes("80") || p.reason?.includes("100"))).reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activePaymentTab === "successful_settlement" ? "ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]" : ""}`}
                onClick={() => setActivePaymentTab("successful_settlement")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Successful Settlements</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                  <div className="text-xl font-bold">৳{dashboard.payments.filter(p => p.type === "successful_settlement" || p.type === "booking_payment").reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activePaymentTab === "due_payment" ? "ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]" : ""}`}
                onClick={() => setActivePaymentTab("due_payment")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due collected</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-1 pb-4">
                  <div className="text-xl font-bold">৳{dashboard.payments.filter(p => p.type === "due_payment").reduce((sum, p) => sum + p.amount, 0).toFixed(0)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>
                    {activePaymentTab === "all_transactions" ? "All Financial Transactions" :
                     activePaymentTab === "40%_penalty" ? "40% Penalty & Refund Records" :
                     activePaymentTab === "80%_penalty" ? "80% and 100% Penalty & Refund Records" :
                     activePaymentTab === "successful_settlement" ? "Successful Settlements" :
                     "Due Collected Records"}
                  </CardTitle>
                  <CardDescription>Detailed transaction history for the selected category across the system.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Phone..."
                      className="pl-8"
                      value={paymentPhoneFilter}
                      onChange={e => setPaymentPhoneFilter(e.target.value)}
                    />
                  </div>

                  <Select value={paymentFilterType} onValueChange={(v: any) => { setPaymentFilterType(v); setPaymentFilterValue(""); }}>
                    <SelectTrigger className="w-[140px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="day">Specific Day</SelectItem>
                      <SelectItem value="month">Specific Month</SelectItem>
                    </SelectContent>
                  </Select>
                  {paymentFilterType !== "all" && (
                    <Input 
                      type={paymentFilterType === "day" ? "date" : "month"} 
                      className="w-[140px]" 
                      value={paymentFilterValue}
                      onChange={e => setPaymentFilterValue(e.target.value)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Locker #</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-xs font-semibold uppercase text-muted-foreground">
                          {payment.type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-xs">{(payment as any).userName}</TableCell>
                        <TableCell className="text-xs">{(payment as any).userPhone}</TableCell>
                        <TableCell className="text-xs font-bold">#{(payment as any).lockerNumber}</TableCell>
                        <TableCell className="text-xs">{(payment as any).stationName}</TableCell>
                        <TableCell className="text-xs">{payment.reason}</TableCell>
                        <TableCell className="text-xs">{new Date(payment.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-primary">৳{payment.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No payment records found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableCell colSpan={7} className="font-bold text-lg">Total Income (Filtered)</TableCell>
                      <TableCell className="text-right font-bold text-lg text-primary">
                        ৳{filteredPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {activeTab === "audit" && (
          <motion.div 
            key="audit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* 3 Tabs */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activeAuditTab === "staff" ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => setActiveAuditTab("staff")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Staff/User Audit</CardTitle>
                  <Badge variant={activeAuditTab === "staff" ? "default" : "secondary"} className="h-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                    {filteredStaffAudit.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <Users className={`h-8 w-8 ${activeAuditTab === "staff" ? "text-primary" : "text-muted-foreground/40"}`} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activeAuditTab === "booking" ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => setActiveAuditTab("booking")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking Audit</CardTitle>
                  <Badge variant={activeAuditTab === "booking" ? "default" : "secondary"} className="h-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                    {filteredBookingAudit.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <ClipboardList className={`h-8 w-8 ${activeAuditTab === "booking" ? "text-primary" : "text-muted-foreground/40"}`} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activeAuditTab === "payment" ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => setActiveAuditTab("payment")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Audit</CardTitle>
                  <Badge variant={activeAuditTab === "payment" ? "default" : "secondary"} className="h-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                    {filteredPaymentAudit.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <CreditCard className={`h-8 w-8 ${activeAuditTab === "payment" ? "text-primary" : "text-muted-foreground/40"}`} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${activeAuditTab === "review" ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => setActiveAuditTab("review")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review Audit</CardTitle>
                  <Badge variant={activeAuditTab === "review" ? "default" : "secondary"} className="h-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                    {filteredReviewAudit.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
                  <Star className={`h-8 w-8 ${activeAuditTab === "review" ? "text-primary" : "text-muted-foreground/40"}`} />
                </CardContent>
              </Card>
            </div>

            {/* Content based on activeAuditTab */}
            {activeAuditTab === "staff" && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Staff/User Audit</CardTitle>
                    <CardDescription>Track all user and staff activities, logins, logouts, and profile updates.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Staff/User Audit</DialogTitle>
                        <DialogDescription>Filter by any combination of fields. Leave empty to show all.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-role" className="text-right">Role</Label>
                          <Select value={staffRoleFilter} onValueChange={(v: any) => setStaffRoleFilter(v)}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-name" className="text-right">Name</Label>
                          <Input id="staff-name" value={staffNameFilter} onChange={e => setStaffNameFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-address" className="text-right">Address</Label>
                          <Input id="staff-address" value={staffAddressFilter} onChange={e => setStaffAddressFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-phone" className="text-right">Phone Number</Label>
                          <Input id="staff-phone" value={staffPhoneFilter} onChange={e => setStaffPhoneFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-day" className="text-right">Day</Label>
                          <Input id="staff-day" type="date" value={staffDayFilter} onChange={e => setStaffDayFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-month" className="text-right">Month</Label>
                          <Input id="staff-month" type="month" value={staffMonthFilter} onChange={e => setStaffMonthFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff-email" className="text-right">Email ID</Label>
                          <Input id="staff-email" value={staffEmailFilter} onChange={e => setStaffEmailFilter(e.target.value)} className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setStaffRoleFilter("all");
                          setStaffNameFilter("");
                          setStaffAddressFilter("");
                          setStaffPhoneFilter("");
                          setStaffDayFilter("");
                          setStaffMonthFilter("");
                          setStaffEmailFilter("");
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Action / Entity</TableHead>
                        <TableHead>Previous State</TableHead>
                        <TableHead>New State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaffAudit.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-1">{log.actorRole}</Badge>
                            <div className="text-xs font-medium">{log.actorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs">{getActionText(log)}</div>
                            <div className="text-[10px] text-muted-foreground">{log.entityType} ({log.entityId.slice(0,8)}...)</div>
                          </TableCell>
                          <TableCell className="text-[10px] font-mono max-w-xs overflow-hidden text-ellipsis">
                            {renderState(log.previousValue)}
                          </TableCell>
                          <TableCell className="text-[10px] font-mono max-w-xs overflow-hidden text-ellipsis">
                            {renderState(log.newValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStaffAudit.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No staff/user audit logs found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeAuditTab === "booking" && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Booking Audit</CardTitle>
                    <CardDescription>Track all booking-related changes and actions.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Booking Audit</DialogTitle>
                        <DialogDescription>Filter by any combination of fields.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-locker" className="text-right">Locker ID</Label>
                          <Input id="booking-locker" value={bookingLockerIdFilter} onChange={e => setBookingLockerIdFilter(e.target.value)} className="col-span-3" placeholder="Exact # e.g. 1" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-phone" className="text-right">User Phone</Label>
                          <Input id="booking-phone" value={bookingUserPhoneFilter} onChange={e => setBookingUserPhoneFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-day" className="text-right">Day</Label>
                          <Input id="booking-day" type="date" value={bookingDayFilter} onChange={e => setBookingDayFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-month" className="text-right">Month</Label>
                          <Input id="booking-month" type="month" value={bookingMonthFilter} onChange={e => setBookingMonthFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-status" className="text-right">Status</Label>
                          <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="key_requested">Key Requested</SelectItem>
                              <SelectItem value="return_requested">Return Requested</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-station" className="text-right">Station</Label>
                          <Select value={bookingStationFilter} onValueChange={setBookingStationFilter}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Station" />
                            </SelectTrigger>
                            <SelectContent position="item-aligned">
                              <SelectItem value="all">All Stations</SelectItem>
                              {stations.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="booking-actor" className="text-right">Role/Actor</Label>
                          <Select value={bookingActorRoleFilter} onValueChange={setBookingActorRoleFilter}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Actor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Actors</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setBookingLockerIdFilter("");
                          setBookingUserPhoneFilter("");
                          setBookingDayFilter("");
                          setBookingMonthFilter("");
                          setBookingStatusFilter("all");
                          setBookingStationFilter("all");
                          setBookingActorRoleFilter("all");
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Locker #</TableHead>
                        <TableHead>User Details</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Previous State</TableHead>
                        <TableHead>New State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookingAudit.map(log => {
                        let userName = "", userPhone = "", userEmail = "", userAddress = "", lockerNumber = "", stationName = "";
                        
                        const parseSafe = (val: string) => {
                          try {
                            const parsed = JSON.parse(val);
                            return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
                          } catch {
                            return {};
                          }
                        };

                        const newVal = parseSafe(log.newValue);
                        const prevVal = parseSafe(log.previousValue);
                        
                        // Robust target selection: prioritize newVal for creations, otherwise check for user data
                        const hasUserData = (obj: any) => obj && (obj.userName || obj.name || obj.userPhone || obj.phone || obj.userEmail || obj.email);
                        const target = (log.actionType === "booking_created" || log.actionType === "booking_otp_sent") 
                          ? newVal 
                          : (hasUserData(newVal) ? newVal : prevVal);

                        userName = target.userName || target.name || "";
                        userPhone = target.userPhone || target.phone || (target.user && target.user.phone) || "";
                        userEmail = target.userEmail || target.email || (target.user && target.user.email) || "";
                        userAddress = target.userAddress || target.address || (target.user && target.user.address) || "";
                        lockerNumber = target.lockerNumber || target.number || "";
                        stationName = target.stationName || "";

                        // Legacy fallback: Extract from raw strings if parsing failed or keys are missing
                        if (!lockerNumber && log.newValue?.includes("Locker:")) {
                          const match = log.newValue.match(/Locker:\s*(\d+)/i);
                          if (match) lockerNumber = match[1];
                        }
                        if (!stationName && log.newValue?.includes("Station:")) {
                          const match = log.newValue.match(/Station:\s*([^\n,]+)/i);
                          if (match) stationName = match[1];
                        }
                        
                        // Even deeper fallback: check if properties exist on the log object itself (if any)
                        if (!stationName && (log as any).stationName) stationName = (log as any).stationName;
                        if (!lockerNumber && (log as any).lockerNumber) lockerNumber = (log as any).lockerNumber;

                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="font-medium text-xs">{log.actionType?.replace(/_/g, ' ')}</div>
                              <Badge variant="secondary" className="text-[10px] h-4 mt-1">{log.actorRole}</Badge>
                            </TableCell>
                            <TableCell className="font-bold">#{lockerNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[11px]">
                                <div><span className="font-medium">Name:</span> {userName || 'N/A'}</div>
                                <div><span className="font-medium">Phone:</span> {userPhone || ''}</div>
                                <div><span className="font-medium">Email:</span> {userEmail || ''}</div>
                                <div><span className="font-medium">Address:</span> {userAddress || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{stationName || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[150px] overflow-hidden text-ellipsis">
                              {renderState(log.previousValue)}
                            </TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[150px] overflow-hidden text-ellipsis">
                              {renderState(log.newValue)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredBookingAudit.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No booking audit logs found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeAuditTab === "payment" && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Payment Audit</CardTitle>
                    <CardDescription>Track all payment-related changes and transactions.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Payment Audit</DialogTitle>
                        <DialogDescription>Filter by any combination of fields.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-type" className="text-right">Type</Label>
                          <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Transactions</SelectItem>
                              <SelectItem value="40_penalty">40% Penalty</SelectItem>
                              <SelectItem value="80_penalty">80% and 100% Refund</SelectItem>
                              <SelectItem value="booking_payment">Payment Successful</SelectItem>
                              <SelectItem value="due_payment">Due Collected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-phone" className="text-right">User Phone</Label>
                          <Input id="payment-phone" value={paymentUserPhoneFilter} onChange={e => setPaymentUserPhoneFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-locker" className="text-right">Locker</Label>
                          <Input id="payment-locker" value={paymentLockerFilter} onChange={e => setPaymentLockerFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-station" className="text-right">Station</Label>
                          <Select value={paymentStationFilter} onValueChange={setPaymentStationFilter}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Station" />
                            </SelectTrigger>
                            <SelectContent position="item-aligned">
                              <SelectItem value="all">All Stations</SelectItem>
                              {stations.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-day" className="text-right">Day</Label>
                          <Input id="payment-day" type="date" value={paymentDayFilter} onChange={e => setPaymentDayFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment-month" className="text-right">Month</Label>
                          <Input id="payment-month" type="month" value={paymentMonthFilter} onChange={e => setPaymentMonthFilter(e.target.value)} className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setPaymentTypeFilter("all");
                          setPaymentUserPhoneFilter("");
                          setPaymentLockerFilter("");
                          setPaymentStationFilter("all");
                          setPaymentDayFilter("");
                          setPaymentMonthFilter("");
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>User Details</TableHead>
                        <TableHead>Locker #</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Previous State</TableHead>
                        <TableHead>New State</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentAudit.map(log => {
                        let userName = "", userPhone = "", userEmail = "", userAddress = "", lockerNumber = "", stationName = "", amount = 0;
                        try {
                          const parseSafe = (val: string) => {
                            if (!val || val === "none") return {};
                            try {
                              const parsed = JSON.parse(val);
                              return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
                            } catch {
                              return {};
                            }
                          };

                          const newVal = parseSafe(log.newValue);
                          const prevVal = parseSafe(log.previousValue);
                          
                          const target = (newVal.userName || newVal.name || newVal.userPhone || newVal.phone || newVal.userEmail || newVal.email || newVal.transactionType === "refund" || newVal.type) ? newVal : prevVal;

                          userName = target.userName || target.name || "";
                          userPhone = target.userPhone || target.phone || (target.user && target.user.phone) || "";
                          userEmail = target.userEmail || target.email || (target.user && target.user.email) || "";
                          userAddress = target.userAddress || target.address || (target.user && target.user.address) || "";
                          lockerNumber = target.lockerNumber || target.number || "";
                          stationName = target.stationName || "";
                          amount = target.amount || 0;
                          
                          // Fallbacks if not deeply nested
                          if (!stationName && log.stationId) {
                            const station = dashboard.receptionists.find(r => r.stationId === log.stationId);
                            if (station) stationName = station.stationName;
                          }
                        } catch (e) {
                          console.error("Error parsing audit log:", e);
                        }
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px]">{log.actionType?.replace(/_/g, ' ')}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[11px]">
                                <div><span className="font-medium">Name:</span> {userName || 'N/A'}</div>
                                <div><span className="font-medium">Phone:</span> {userPhone || ''}</div>
                                <div><span className="font-medium">Email:</span> {userEmail || ''}</div>
                                <div><span className="font-medium">Address:</span> {userAddress || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-bold">#{lockerNumber || 'N/A'}</TableCell>
                            <TableCell className="text-xs">{stationName || 'N/A'}</TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[150px] overflow-hidden text-ellipsis">
                              {renderState(log.previousValue)}
                            </TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[150px] overflow-hidden text-ellipsis">
                              {renderState(log.newValue)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">৳{amount.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredPaymentAudit.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No payment audit logs found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {activeAuditTab === "review" && (
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Review Audit</CardTitle>
                    <CardDescription>Monitor who is submitting or deleting reviews, and why.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Review Audit</DialogTitle>
                        <DialogDescription>Filter by Day or Month.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="review-day" className="text-right">Day</Label>
                          <Input id="review-day" type="date" value={reviewDayFilter} onChange={e => setReviewDayFilter(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="review-month" className="text-right">Month</Label>
                          <Input id="review-month" type="month" value={reviewMonthFilter} onChange={e => setReviewMonthFilter(e.target.value)} className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setReviewDayFilter("");
                          setReviewMonthFilter("");
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Previous State</TableHead>
                        <TableHead>New State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviewAudit.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-1">{log.actorRole}</Badge>
                            <div className="text-xs font-bold">{log.actorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-black text-xs text-primary">{log.actionType?.replace(/_/g, ' ').toUpperCase()}</div>
                          </TableCell>
                          <TableCell className="text-[10px] font-mono max-w-[200px] overflow-hidden text-ellipsis">
                            {renderState(log.previousValue)}
                          </TableCell>
                          <TableCell className="text-[10px] font-mono max-w-[200px] overflow-hidden text-ellipsis">
                            {renderState(log.newValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredReviewAudit.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <Star className="h-10 w-10 mx-auto mb-2 opacity-10" />
                            <p>No review audit logs found.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
        
        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <AdminReviewsPanel />
          </motion.div>
        )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// AdminReviewsPanel — Full review management: filter + sort + delete
// Real-time via stable useCallback so socket listener never leaks
// ─────────────────────────────────────────────────────────────────────

type AdminReview = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
};

function AdminStarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);



  const { toast } = useToast();

  // ── Stable fetch — useCallback so useRealtime never leaks ──
  const fetchReviews = useCallback(async () => {
    try {
      const res  = await fetch(`/api/smart-tourist/reviews?limit=100`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error("Failed to fetch admin reviews", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when date-filters change
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Real-time: stable callback → no socket leaks ───────
  useRealtime(fetchReviews);

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/smart-tourist/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Review Deleted", description: "Review removed successfully." });
      await fetchReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const displayed = reviews;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "–";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" /> Review Management
          </h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Monitor, filter, sort, and moderate all traveler reviews in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-black text-primary">{reviews.length} Reviews</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-amber-600">{avgRating} Avg</span>
          </div>
        </div>
      </div>



      {/* ── Reviews Table ── */}
      <Card className="glass-card rounded-[2rem] border-white/20 shadow-xl overflow-hidden">
        <CardHeader className="px-8 py-6 border-b border-white/10">
          <CardTitle className="text-lg font-black tracking-tight">
            All Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Star className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground font-medium">No reviews found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-muted/20">
                  <TableHead className="font-black uppercase tracking-widest text-[10px] pl-8">Reviewer</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Rating</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Review</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Date & Time</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-right pr-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((review) => (
                  <TableRow key={review.id} className="border-white/5 hover:bg-white/20 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                          <span className="text-[10px] font-black text-primary">
                            {review.userName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black">{review.userName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{review.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <AdminStarDisplay value={review.rating} />
                        <p className="text-[10px] font-black text-muted-foreground">
                          {["","Terrible","Poor","Average","Good","Excellent"][review.rating]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-foreground/75 line-clamp-3 leading-relaxed">{review.text}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-bold">
                          {new Date(review.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {new Date(review.createdAt).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleting === review.id}
                        onClick={() => handleDelete(review.id)}
                        className="h-8 px-3 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
                      >
                        {deleting === review.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

