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
  AlertCircle,
  FileText,
  Download,
  Menu,
  X,
  Tag,
  Fingerprint,
  Package,
  DollarSign,
  Phone,
  Mail
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn, useRealtime, formatDateLocal, formatMonthLocal, formatDateTime } from "@/lib/utils";
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedReceptionist, setSelectedReceptionist] = useState<any>(null);
  
  // Pricing state
  const [pricingSearch, setPricingSearch] = useState("");
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [selectedStationForPrice, setSelectedStationForPrice] = useState<any>(null);
  const [newPriceValue, setNewPriceValue] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

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

  const [reportSections, setReportSections] = useState({
    bookings: false,
    penalty40: false,
    penalty80: false,
    settlement: false,
    due: false,
    staff: false,
  });
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  const [isAddTerminalOpen, setIsAddTerminalOpen] = useState(false);
  const [isAddingTerminal, setIsAddingTerminal] = useState(false);
  const [isDeletingTerminal, setIsDeletingTerminal] = useState<string | null>(null);
  const [terminalToDelete, setTerminalToDelete] = useState<any>(null);
  const [addTerminalData, setAddTerminalData] = useState({
    stationName: "",
    destinationId: "",
    address: "",
    receptionistName: "",
    phone: "",
    password: "station123",
    lockerCount: 100
  });

  const [stationAuditSearch, setStationAuditSearch] = useState("");
  const [stationAuditFilter, setStationAuditFilter] = useState<"all" | "live" | "terminated">("all");
  const [selectedStationAudit, setSelectedStationAudit] = useState<any>(null);
  const [selectedLockerForensic, setSelectedLockerForensic] = useState<any>(null);
  const [isLockerForensicOpen, setIsLockerForensicOpen] = useState(false);
  const [forensicData, setForensicData] = useState<any>(null);
  const [isForensicLoading, setIsForensicLoading] = useState(false);
  const [forensicMonthFilter, setForensicMonthFilter] = useState("");
  const [forensicDateFilter, setForensicDateFilter] = useState("");
  const [stationAuditList, setStationAuditList] = useState<any[]>([]);
  const [isStationAuditLoading, setIsStationAuditLoading] = useState(false);

  const [userAuditSearch, setUserAuditSearch] = useState("");
  const [userAuditFilter, setUserAuditFilter] = useState<"all" | "present" | "deleted">("all");
  const [userAuditCategory, setUserAuditCategory] = useState<"all" | "new" | "old">("all");
  const [userAuditList, setUserAuditList] = useState<any[]>([]);
  const [isUserAuditLoading, setIsUserAuditLoading] = useState(false);
  const [selectedUserAudit, setSelectedUserAudit] = useState<any>(null);
  const [userForensicData, setUserForensicData] = useState<any>(null);
  const [isUserForensicLoading, setIsUserForensicLoading] = useState(false);
  const [userForensicMonthFilter, setUserForensicMonthFilter] = useState("");
  const [userForensicDateFilter, setUserForensicDateFilter] = useState("");
  const [isUserForensicModalOpen, setIsUserForensicModalOpen] = useState(false);
  const [selectedForensicLocker, setSelectedForensicLocker] = useState<string | null>(null);

  const fetchStationAuditList = async () => {
    setIsStationAuditLoading(true);
    try {
      const res = await fetch("/api/smart-tourist/admin/station-audit");
      const data = await res.json();
      setStationAuditList(data);
    } catch (err) {
      console.error("Failed to fetch station audit list", err);
    } finally {
      setIsStationAuditLoading(false);
    }
  };

  const fetchForensicData = async (stationId: string, lockerNumber: number) => {
    setIsForensicLoading(true);
    try {
      const res = await fetch(`/api/smart-tourist/admin/forensics/locker/${stationId}/${lockerNumber}`);
      const data = await res.json();
      setForensicData(data);
    } catch (err) {
      console.error("Failed to fetch forensic data", err);
    } finally {
      setIsForensicLoading(false);
    }
  };

  const fetchUserAuditList = async () => {
    setIsUserAuditLoading(true);
    try {
      const res = await fetch("/api/smart-tourist/admin/user-audit");
      const data = await res.json();
      setUserAuditList(data);
    } catch (err) {
      console.error("Failed to fetch user audit list", err);
    } finally {
      setIsUserAuditLoading(false);
    }
  };

  const fetchUserForensicData = async (userId: string) => {
    setIsUserForensicLoading(true);
    try {
      const res = await fetch(`/api/smart-tourist/admin/forensics/user/${userId}`);
      const data = await res.json();
      setUserForensicData(data);
    } catch (err) {
      console.error("Failed to fetch user forensic data", err);
    } finally {
      setIsUserForensicLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "station-audit") {
      fetchStationAuditList();
    } else if (activeTab === "user-audit") {
      fetchUserAuditList();
    }
  }, [activeTab]);

  const handleAddTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingTerminal(true);
    try {
      const res = await fetch("/api/smart-tourist/admin/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addTerminalData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create terminal");
      
      toast({ title: "Success", description: "Terminal created successfully" });
      setIsAddTerminalOpen(false);
      setAddTerminalData({
        stationName: "", destinationId: "", address: "", receptionistName: "", phone: "", password: "station123", lockerCount: 100
      });
      queryClient.invalidateQueries({ queryKey: getGetSmartTouristAdminDashboardQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAddingTerminal(false);
    }
  };

  const handleDeleteTerminal = async () => {
    if (!terminalToDelete) return;
    const stationId = terminalToDelete.stationId;
    
    setIsDeletingTerminal(stationId);
    try {
      const res = await fetch(`/api/smart-tourist/admin/stations/${stationId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete terminal");
      
      toast({ title: "Success", description: "Terminal deleted successfully" });
      queryClient.invalidateQueries({ queryKey: getGetSmartTouristAdminDashboardQueryKey() });
      setTerminalToDelete(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeletingTerminal(null);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationForPrice || !newPriceValue) return;
    
    setIsUpdatingPrice(true);
    try {
      const res = await fetch(`/api/smart-tourist/stations/${selectedStationForPrice.id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerHour: Number(newPriceValue) })
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update price");
        
        toast({ title: "Price Updated", description: `Successfully updated pricing for ${selectedStationForPrice.name}` });
        setIsUpdatePriceOpen(false);
        setSelectedStationForPrice(null);
        setNewPriceValue("");
        queryClient.invalidateQueries({ queryKey: getGetSmartTouristAdminDashboardQueryKey() });
      } else {
        const errorText = await res.text();
        console.error("Server Error Response:", errorText);
        throw new Error(`Server is not ready (Error ${res.status}). Please wait for the Render backend to finish redeploying.`);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdatingPrice(false);
    }
  };

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
    return (dashboard?.auditLogs || []).map(log => {
      let actorEmail = "";
      let actorPhone = "";
      let actorAddress = "";
      let userPhone = "";
      let lockerNumber = "";
      let stationName = "";
      let stationId = log.stationId || "";

      // 1. Try to find details from memory based on IDs
      if (log.entityType === "user" || (log.entityType === "session" && log.actorRole === "user")) {
        const user = dashboard?.users?.find(u => u.id === log.entityId);
        if (user) {
          actorEmail = user.email || "";
          actorPhone = user.phone || "";
          actorAddress = user.address || "";
          userPhone = user.phone || "";
        }
      } else if (log.entityType === "receptionist" || (log.entityType === "session" && log.actorRole === "receptionist")) {
        const rec = dashboard?.receptionists?.find(r => r.id === log.entityId);
        if (rec) {
          actorEmail = rec.email || "";
          actorPhone = (rec as any).phone || "";
          stationId = stationId || rec.stationId || "";
        }
      } else if (log.entityType === "booking") {
        const b = dashboard?.bookings?.find(item => item.id === log.entityId);
        if (b) {
          userPhone = b.userPhone || "";
          lockerNumber = b.lockerNumber?.toString() || "";
          stationName = b.stationName || "";
          stationId = stationId || b.stationId || "";
        }
      } else if (log.entityType === "payment") {
        const p = dashboard?.payments?.find(item => item.id === log.entityId);
        if (p) {
          userPhone = p.userPhone || "";
          lockerNumber = p.lockerNumber?.toString() || "";
          stationId = stationId || p.stationId || "";
        }
      }

      // 2. Deep enrichment from JSON (important for immutable history or deleted entities)
      try {
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
        
        if (target && typeof target === 'object') {
          actorEmail = actorEmail || target.email || target.userEmail || target.actorEmail || "";
          actorPhone = actorPhone || target.phone || target.userPhone || target.actorPhone || "";
          actorAddress = actorAddress || target.address || target.userAddress || target.actorAddress || "";
          userPhone = userPhone || target.userPhone || target.phone || (target.user && target.user.phone) || "";
          lockerNumber = lockerNumber || target.lockerNumber?.toString() || target.number?.toString() || "";
          stationName = stationName || target.stationName || "";
          stationId = stationId || target.stationId || "";
        }
        
        // robust status extraction for booking
        if (log.entityType === "booking") {
          (log as any).status = newVal.status || prevVal.status || "";
        }

        // robust extraction for payment
        if (log.entityType === "payment" || log.actionType?.includes('payment')) {
          const targetAmt = newVal.amount !== undefined ? newVal : prevVal;
          if (targetAmt.amount) (log as any).amount = targetAmt.amount;
        }

        // Fallbacks
        if (!lockerNumber && log.newValue?.includes("Locker:")) {
          const match = log.newValue.match(/Locker:\s*(\d+)/i);
          if (match) lockerNumber = match[1];
        }
        if (!stationName && log.newValue?.includes("Station:")) {
          const match = log.newValue.match(/Station:\s*([^\n,]+)/i);
          if (match) stationName = match[1];
        }
        if (!stationName && (log as any).stationName) stationName = (log as any).stationName;
        if (!lockerNumber && (log as any).lockerNumber) lockerNumber = (log as any).lockerNumber;

        // Try to map stationName to stationId if missing
        if (stationName && !stationId) {
          const station = dashboard?.receptionists?.find(r => r.stationName === stationName || r.stationId === stationName);
          if (station) stationId = station.stationId;
        }
      } catch (err) {
        console.error("Enrichment error:", err);
      }

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

  // Second pass for chronological history tracking (O(N) instead of O(N^2))
  const chronologicalAuditLogs = useMemo(() => {
    // Sort ascending for chain building. Use ID as fallback for same-second logs.
    const logs = [...enrichedAuditLogs].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });

    const latestLockerStates = new Map<string, string>();
    
    const processed = logs.map(log => {
      const locker = log.lockerNumber;
      const actStr = (log.action || log.actionType || '').toLowerCase();
      const isPay = actStr.includes('payment') || actStr.includes('penalty') || actStr.includes('refund') || actStr.includes('settlement');
      
      let chronologicalPrevValue = log.previousValue;
      if (isPay && locker) {
        // ALWAYS use the tracked state from our map if we have one for this locker
        const tracked = latestLockerStates.get(locker);
        if (tracked) {
          chronologicalPrevValue = tracked;
        }
        // Update the map with the latest known state for this locker
        latestLockerStates.set(locker, log.newValue);
      }
      return { ...log, chronologicalPrevValue };
    });

    // Return descending for UI (newest first)
    return processed.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [enrichedAuditLogs]);

  const filteredStaffAudit = useMemo(() => {
    let result = chronologicalAuditLogs.filter(log => {
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
  }, [chronologicalAuditLogs, staffRoleFilter, staffNameFilter, staffDayFilter, staffMonthFilter, staffEmailFilter, staffPhoneFilter, staffAddressFilter]);

  const filteredBookingAudit = useMemo(() => {
    let result = chronologicalAuditLogs.filter(log => log.entityType === "booking");
    if (bookingLockerIdFilter) {
      result = result.filter(log => (log.lockerNumber || "").toString() === bookingLockerIdFilter);
    }
    if (bookingStatusFilter !== "all") {
      result = result.filter(log => (log as any).status === bookingStatusFilter);
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
  }, [chronologicalAuditLogs, bookingLockerIdFilter, bookingStatusFilter, bookingDayFilter, bookingMonthFilter, bookingUserPhoneFilter, bookingStationFilter, bookingActorRoleFilter]);

  const filteredPaymentAudit = useMemo(() => {
    let result = chronologicalAuditLogs.filter(log => {
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
  }, [chronologicalAuditLogs, paymentTypeFilter, paymentUserPhoneFilter, paymentLockerFilter, paymentStationFilter, paymentDayFilter, paymentMonthFilter]);

  const filteredReviewAudit = useMemo(() => {
    let result = chronologicalAuditLogs.filter(log => log.entityType === "review");
    if (reviewDayFilter) result = result.filter(log => formatDateLocal(log.createdAt) === reviewDayFilter);
    if (reviewMonthFilter) result = result.filter(log => formatMonthLocal(log.createdAt) === reviewMonthFilter);
    return result;
  }, [chronologicalAuditLogs, reviewDayFilter, reviewMonthFilter]);

  useEffect(() => {
    if (role !== "admin" || !adminName) setLocation("/");
  }, [role, adminName, setLocation]);

  if (role !== "admin" || !adminName) return null;
  if (dashLoading || !dashboard || !dashboard.bookings || !dashboard.payments) return <DashboardSkeleton />;

  const getActionText = (log: any) => {
    const action = log.actionType || log.action || '';
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const getPaymentActionNarrative = (action: string, role: string) => {
    const act = (action || '').toLowerCase();
    const r = (role === 'receptionist' ? 'Receptionist' : (role === 'user' ? 'Traveler' : 'System'));
    
    if (act.includes('refund')) return `Refund Issued by ${r}`;
    if (act.includes('penalty')) return `Penalty Charged by ${r}`;
    if (act.includes('settlement')) return `Settlement by ${r}`;
    if (act.includes('payment')) return `Payment by ${r}`;
    if (act.includes('due')) return `Due Payment by ${r}`;
    
    return `${(action || 'Action').replace(/_/g, ' ')} by ${r}`;
  };

  const getBookingActionNarrative = (action: string, role: string) => {
    const act = (action || '').toLowerCase();
    const r = (role === 'receptionist' ? 'Receptionist' : (role === 'user' ? 'Traveler' : 'System'));
    
    if (act.includes('created')) return `Booking Created by ${r}`;
    if (act.includes('requested')) return `Key Requested by ${r}`;
    if (act.includes('provided')) return `Key Provided by ${r}`;
    if (act.includes('active')) return `Booking Activated by ${r}`;
    if (act.includes('completed')) return `Booking Completed by ${r}`;
    if (act.includes('cancelled')) return `Booking Cancelled by ${r}`;
    if (act.includes('deleted')) return `Booking Deleted by ${r}`;
    if (act.includes('otp')) return `OTP Sent to ${r}`;
    
    return `${(action || 'Action').replace(/_/g, ' ')} by ${r}`;
  };

  const renderCleanState = (state: string, isPrevious: boolean = false) => {
    const value = state?.toString()?.trim();
    if (!value || value.toLowerCase() === 'none') {
      return isPrevious ? <span className="text-muted-foreground/40 font-bold">—</span> : <Badge variant="outline" className="opacity-40 italic">Initial</Badge>;
    }
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'object') {
        const keys = Object.entries(obj).filter(([k, v]) => !['id', 'userId', 'bookingId', 'stationId', 'createdAt', 'updatedAt'].includes(k) && v !== null && v !== "");
        if (keys.length === 0) return <span className="text-muted-foreground/40 font-bold">—</span>;
        
        return (
          <div className="flex flex-wrap gap-1.5 max-w-[180px]">
            {keys.slice(0, 3).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5 border border-border/50 text-[9px]">
                <span className="text-muted-foreground uppercase">{k}:</span>
                <span className="font-bold text-foreground truncate max-w-[80px]">{String(v)}</span>
              </div>
            ))}
            {keys.length > 3 && <span className="text-[9px] text-muted-foreground">+{keys.length - 3} more</span>}
          </div>
        );
      }
    } catch { return <span className="text-[10px] truncate max-w-[150px] inline-block">{value}</span>; }
    return null;
  };

  const renderPaymentState = (state: string, isPrevious: boolean = false) => {
    const value = state?.toString()?.trim();
    if (!value || value.toLowerCase() === 'none' || value === '{}') {
      return <Badge variant="outline" className="opacity-40 italic">Initial</Badge>;
    }
    
    try {
      const obj = JSON.parse(value);
      if (obj && typeof obj === 'object') {
        const type = obj.type || obj.TYPE || obj.actionType || "";
        const amount = obj.amount || obj.AMOUNT || "";
        const reason = obj.reason || obj.REASON || "";
        
        if (type || reason) {
           let color = "bg-blue-500/10 text-blue-500";
           if (type.includes('success') || type.includes('payment') || type.includes('pay')) color = "bg-emerald-500/10 text-emerald-500";
           if (type.includes('refund')) color = "bg-amber-500/10 text-amber-500";
           if (type.includes('penalty')) color = "bg-red-500/10 text-red-500";
           
           const typeStr = (type || "Transaction").replace(/_/g, ' ').toUpperCase();
           
           return (
             <div className="flex flex-col gap-1">
               <Badge className={cn("rounded px-2 py-0.5 text-[9px] uppercase tracking-wider border-none shadow-none w-fit", color)}>
                 {typeStr}
               </Badge>
               {reason && <span className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={reason}>{reason}</span>}
               {amount && <span className="text-[10px] font-bold">৳{amount}</span>}
             </div>
           );
        }
      }
    } catch {}
    
    // Fallback to clean state if no special type/reason found
    return renderCleanState(state, isPrevious);
  };

  const renderBookingState = (state: string, fallbackAction?: string, isPrevious: boolean = false) => {
    const value = state?.toString()?.trim();
    if (!value || value.toLowerCase() === 'none') {
      if (isPrevious) return <span className="text-muted-foreground/40 font-bold">—</span>;
      if (!fallbackAction) return <Badge variant="outline" className="opacity-40 italic">Initial</Badge>;
      if (fallbackAction === 'booking_deleted' || fallbackAction === 'booking_cancelled') return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-none shadow-none uppercase tracking-widest text-[10px]">Cancelled</Badge>;
      return <Badge variant="outline" className="opacity-40 italic">Initial</Badge>;
    }
    let statusStr = value;
    try {
      const obj = JSON.parse(value);
      if (obj && obj.status) {
        statusStr = obj.status;
      }
    } catch {}

    statusStr = statusStr.replace(/_/g, ' ');

    let color = "bg-primary text-white shadow-primary/20";
    if (statusStr.includes('active')) color = "bg-emerald-500 text-white shadow-emerald-500/20";
    if (statusStr.includes('key requested') || statusStr.includes('return requested')) color = "bg-amber-500 text-white shadow-amber-500/20";
    if (statusStr.includes('completed')) color = "bg-slate-500 text-white shadow-slate-500/20";
    if (statusStr.includes('cancelled') || statusStr.includes('deleted')) color = "bg-red-500 text-white shadow-red-500/20";
    if (statusStr === 'Initial') color = "bg-transparent border border-muted-foreground/30 text-muted-foreground opacity-50";

    return (
      <Badge className={cn("rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-lg whitespace-nowrap", color)}>
        {statusStr}
      </Badge>
    );
  };



  const stats = [
    { label: "Bookings", value: dashboard?.bookings?.length || 0, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+8%" },
    { label: "Travelers", value: dashboard?.users?.filter(u => !u.deletedAt).length || 0, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "+12%" },
    { label: "Revenue", value: `৳${(dashboard?.payments || []).reduce((acc, p) => acc + (p.type?.includes('penalty') ? 0 : (p.amount || 0)), 0).toLocaleString()}`, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+15%" },
    { label: "Security Logs", value: dashboard?.auditLogs?.length || 0, icon: History, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Live" },
  ];

  const sidebarLinks = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Operations", icon: ClipboardList },
    { id: "users", label: "Staff & Users", icon: Users },
    { id: "payments", label: "Financials", icon: CreditCard },
    { id: "pricing", label: "Station Pricing", icon: Tag },
    { id: "audit", label: "Audit Engine", icon: History },
    { id: "station-audit", label: "Station Audit", icon: ShieldCheck },
    { id: "user-audit", label: "User Audit", icon: UserCircle },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`w-80 border-r border-white/40 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-3xl p-8 flex-col gap-6 shadow-2xl xl:relative ${sidebarOpen ? 'flex fixed top-0 left-0 h-full z-50 overflow-y-auto' : 'hidden xl:flex'}`}
      >
        <div className="xl:hidden flex justify-end mb-2">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
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
                  onClick={() => { setActiveTab(link.id); setSidebarOpen(false); }}
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
        <div className="xl:hidden flex items-center gap-4 mb-8">
          <button onClick={() => setSidebarOpen(true)} className="p-3 rounded-2xl glass-card border-white/20 shadow-xl hover:bg-primary/10 transition-colors">
            <Menu className="h-6 w-6 text-primary" />
          </button>
          <span className="font-black text-lg tracking-tight">{sidebarLinks.find(l => l.id === activeTab)?.label}</span>
        </div>
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
                {dashboard.receptionists.filter(r => !r.terminatedAt).slice(0, 4).map((r) => (
                  <div key={r.id} className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-lg hover:z-10 transition-transform hover:scale-110">
                    <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(r.name)}`} alt={r.name} />
                  </div>
                ))}
              </div>
              <div className="px-6 border-l border-white/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Staff</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-sm font-black">{dashboard.receptionists.filter(r => !r.terminatedAt).length} Terminals</p>
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
                                <div className="text-xs font-black">IN: {formatDateTime(booking.checkInTime)}</div>
                                <div className="text-[10px] text-muted-foreground font-medium">EXP: {formatDateTime(booking.checkOutTime)}</div>
                              </TableCell>
                              <TableCell className="font-black text-xl text-primary">৳{Number(booking.amount || 0).toFixed(2)}</TableCell>
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
                              <TableCell className="text-xs font-black uppercase tracking-tight">{formatDateTime(item.createdAt)}</TableCell>
                              <TableCell className="font-black text-xl">৳{Number(item.amount || 0).toFixed(2)}</TableCell>
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
                  Registered Travelers ({dashboard.users.filter(u => !u.deletedAt).length})
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
                    {dashboard.users.filter(u => !u.deletedAt).map(u => (
                      <TableRow key={u.id} className="cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => setSelectedUser(u)}>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Station Receptionists ({dashboard.receptionists.filter(r => !r.terminatedAt).length})
                </CardTitle>
                <Dialog open={isAddTerminalOpen} onOpenChange={setIsAddTerminalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full font-bold">
                      + Add Terminal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-8 border-white/20 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">Add New Terminal</DialogTitle>
                      <DialogDescription>Create a new station, lockers, and receptionist account.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddTerminal} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Station Name *</Label>
                        <Input required value={addTerminalData.stationName} onChange={e => setAddTerminalData(prev => ({...prev, stationName: e.target.value}))} placeholder="e.g. Inani Beach Point" />
                      </div>
                      <div className="space-y-2">
                        <Label>Destination *</Label>
                        <Select required value={addTerminalData.destinationId} onValueChange={val => setAddTerminalData(prev => ({...prev, destinationId: val}))}>
                          <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                          <SelectContent>
                            {bootstrapData?.destinations?.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Address *</Label>
                        <Input required value={addTerminalData.address} onChange={e => setAddTerminalData(prev => ({...prev, address: e.target.value}))} placeholder="Station location details" />
                      </div>
                      <div className="space-y-2">
                        <Label>Receptionist Name *</Label>
                        <Input required value={addTerminalData.receptionistName} onChange={e => setAddTerminalData(prev => ({...prev, receptionistName: e.target.value}))} placeholder="Full Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone (Optional)</Label>
                          <Input value={addTerminalData.phone} onChange={e => setAddTerminalData(prev => ({...prev, phone: e.target.value}))} placeholder="Phone number" />
                        </div>
                        <div className="space-y-2">
                          <Label>Lockers *</Label>
                          <Input type="number" required min="1" value={addTerminalData.lockerCount} onChange={e => setAddTerminalData(prev => ({...prev, lockerCount: parseInt(e.target.value)}))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Initial Password *</Label>
                        <Input required value={addTerminalData.password} onChange={e => setAddTerminalData(prev => ({...prev, password: e.target.value}))} />
                      </div>
                      <Button type="submit" className="w-full rounded-2xl" disabled={isAddingTerminal}>
                        {isAddingTerminal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Terminal
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Station Assignment</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.receptionists.filter(r => !r.terminatedAt).map(r => (
                      <TableRow key={r.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedReceptionist(r)}>{r.name}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => setSelectedReceptionist(r)}>
                          <div className="text-xs font-medium">{r.stationName}</div>
                          <div className="text-[10px] text-muted-foreground">{r.id}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground cursor-pointer" onClick={() => setSelectedReceptionist(r)}>{r.email}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); setTerminalToDelete(r); }}
                            disabled={isDeletingTerminal === r.stationId}
                          >
                            {isDeletingTerminal === r.stationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Delete Terminal Confirmation Modal */}
            <Dialog open={!!terminalToDelete} onOpenChange={(open) => { if (!open) setTerminalToDelete(null); }}>
              <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-8 border-white/20 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-red-500">Close Terminal?</DialogTitle>
                  <DialogDescription className="text-sm font-medium">
                    Are you sure you want to permanently close <strong>{terminalToDelete?.stationName}</strong>?
                    This will delete its receptionist account and all associated lockers. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-4 mt-4 w-full">
                  <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setTerminalToDelete(null)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1 rounded-2xl" onClick={handleDeleteTerminal} disabled={isDeletingTerminal === terminalToDelete?.stationId}>
                    {isDeletingTerminal === terminalToDelete?.stationId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Confirm Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* User Detail Modal */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
              <DialogContent className="sm:max-w-lg rounded-[2.5rem] glass-card p-0 overflow-hidden shadow-2xl">
                <div className="bg-primary/5 p-10 border-b border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                      <UserCircle className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-black tracking-tighter">{selectedUser?.name}</DialogTitle>
                      <DialogDescription className="font-bold text-primary opacity-60">Traveler Profile Details</DialogDescription>
                    </div>
                  </div>
                </div>
                <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedUser?.name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedUser?.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedUser?.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedUser?.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Password</p>
                    <p className="text-sm font-bold bg-primary/5 p-3 rounded-xl border-2 border-primary/20">{selectedUser?.password || '••••••'}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Receptionist Detail Modal */}
            <Dialog open={!!selectedReceptionist} onOpenChange={(open) => { if (!open) setSelectedReceptionist(null); }}>
              <DialogContent className="sm:max-w-lg rounded-[2.5rem] glass-card p-0 overflow-hidden shadow-2xl">
                <div className="bg-primary/5 p-10 border-b border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                      <LayoutDashboard className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-black tracking-tighter">{selectedReceptionist?.name}</DialogTitle>
                      <DialogDescription className="font-bold text-primary opacity-60">Receptionist Profile Details</DialogDescription>
                    </div>
                  </div>
                </div>
                <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedReceptionist?.name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Employee ID</p>
                      <p className="text-xs font-mono font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedReceptionist?.id || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Station Assignment</p>
                      <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedReceptionist?.stationName || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Station ID</p>
                      <p className="text-xs font-mono font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedReceptionist?.stationId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
                    <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{selectedReceptionist?.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Password</p>
                    <p className="text-sm font-bold bg-primary/5 p-3 rounded-xl border-2 border-primary/20">{selectedReceptionist?.password || '••••••'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</p>
                    <p className="text-sm font-bold bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/40">{(selectedReceptionist as any)?.phone || 'N/A'}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                        <TableCell className="text-xs">{formatDateTime(payment.createdAt)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">৳{Number(payment.amount || 0).toFixed(2)}</TableCell>
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
                        ৳{Number(filteredPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "pricing" && (
          <motion.div 
            key="pricing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                  <Tag className="h-7 w-7 text-primary" /> Dynamic Station Pricing
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Manage hourly rates for each terminal. Changes reflect instantly across all platforms.
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Station or Destination..." 
                  className="pl-11 rounded-2xl bg-white/50 border-white/20 shadow-inner"
                  value={pricingSearch}
                  onChange={e => setPricingSearch(e.target.value)}
                />
              </div>
            </div>

            <Card className="glass-card rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[10px]">Terminal Details</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Destination</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Current Rate</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Locker Load</TableHead>
                    <TableHead className="px-8 text-right font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.receptionists
                    .filter(r => 
                      r.stationName.toLowerCase().includes(pricingSearch.toLowerCase()) || 
                      (bootstrapData?.destinations?.find(d => d.id === r.stationId.split('-')[0])?.name || "").toLowerCase().includes(pricingSearch.toLowerCase())
                    )
                    .map(r => {
                      const station = bootstrapData?.stations?.find(s => s.id === r.stationId);
                      return (
                        <TableRow key={r.id} className="group hover:bg-primary/5 transition-colors">
                          <TableCell className="px-8 py-6">
                            <div className="font-black text-base">{r.stationName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{r.stationId}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-white/40 dark:bg-black/20 border-white/40 font-bold">
                              {bootstrapData?.destinations?.find(d => d.id === r.stationId.split('-')[0])?.name || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-primary">৳{station?.pricePerHour || 50}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">/ Hour</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-bold">{station?.bookedLockers || 0} / {station?.totalLockers || 0}</div>
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${((station?.bookedLockers || 0) / (station?.totalLockers || 1)) * 100}%` }} 
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-8 text-right">
                            <Button 
                              onClick={() => {
                                setSelectedStationForPrice(station);
                                setNewPriceValue(String(station?.pricePerHour || 50));
                                setIsUpdatePriceOpen(true);
                              }}
                              className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg"
                            >
                              Update Price
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>

            {/* Price Update Modal */}
            <Dialog open={isUpdatePriceOpen} onOpenChange={setIsUpdatePriceOpen}>
              <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-10 border-white/20 shadow-2xl">
                <DialogHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto">
                    <Tag className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <DialogTitle className="text-2xl font-black tracking-tight">Update Hourly Rate</DialogTitle>
                    <DialogDescription className="font-bold text-primary opacity-60">
                      {selectedStationForPrice?.name}
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <form onSubmit={handleUpdatePrice} className="space-y-8 mt-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">New Hourly Price (BDT)</Label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary">৳</span>
                      <Input 
                        required 
                        type="number" 
                        min="1" 
                        value={newPriceValue} 
                        onChange={e => setNewPriceValue(e.target.value)}
                        className="pl-14 h-20 rounded-2xl bg-white/50 border-2 border-primary/20 focus:border-primary text-3xl font-black shadow-inner"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60 text-center italic">
                      This price will apply to all NEW bookings at this station instantly.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={() => setIsUpdatePriceOpen(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20" disabled={isUpdatingPrice}>
                      {isUpdatingPrice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Apply New Rate
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                          <TableCell className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-1">{log.actorRole}</Badge>
                            <div className="text-xs font-medium">{log.actorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs">{getActionText(log)}</div>
                            <div className="text-[10px] text-muted-foreground">{log.entityType} ({log.entityId.slice(0,8)}...)</div>
                          </TableCell>
                          <TableCell>
                            {renderCleanState(log.previousValue, true)}
                          </TableCell>
                          <TableCell>
                            {renderCleanState(log.newValue, false)}
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
                            <TableCell className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            <TableCell>
                              <div className="font-bold text-xs text-primary">{getBookingActionNarrative(log.actionType, log.actorRole)}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 font-medium">By {log.actorName}</div>
                            </TableCell>
                            <TableCell className="font-bold text-lg">#{lockerNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[11px]">
                                <div><span className="font-medium">Name:</span> {userName || 'N/A'}</div>
                                <div><span className="font-medium">Phone:</span> {userPhone || ''}</div>
                                <div><span className="font-medium">Email:</span> {userEmail || ''}</div>
                                <div><span className="font-medium">Address:</span> {userAddress || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-bold uppercase tracking-tight">{stationName || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              {renderBookingState(log.previousValue, undefined, true)}
                            </TableCell>
                            <TableCell>
                              {renderBookingState(log.newValue, log.actionType, false)}
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
                        let userName = "", userPhone = "", userEmail = "", userAddress = "", lockerNumber = "", stationName = "", amount = 0, chronologicalPrevValue = "";
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
                          
                          const target = (newVal.amount !== undefined || newVal.type || newVal.userName || newVal.name) ? newVal : prevVal;

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

                          chronologicalPrevValue = (log as any).chronologicalPrevValue || log.previousValue;
                          
                        } catch (e) {
                          console.error("Error parsing audit log:", e);
                        }
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            <TableCell>
                              <div className="font-bold text-xs text-primary">{getPaymentActionNarrative(log.actionType, log.actorRole)}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 font-medium">By {log.actorName}</div>
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
                            <TableCell>
                              {renderPaymentState(chronologicalPrevValue, true)}
                            </TableCell>
                            <TableCell>
                              {renderPaymentState(log.newValue, false)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">৳{Number(amount || 0).toFixed(2)}</TableCell>
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
                          <TableCell className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-1">{log.actorRole}</Badge>
                            <div className="text-xs font-bold">{log.actorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-black text-xs text-primary">{log.actionType?.replace(/_/g, ' ').toUpperCase()}</div>
                          </TableCell>
                          <TableCell>
                            {renderCleanState(log.previousValue, true)}
                          </TableCell>
                          <TableCell>
                            {renderCleanState(log.newValue, false)}
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

        {activeTab === "reports" && (
          <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tighter mb-1">Report Generator</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Generate professional monthly PDF reports</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Report Sections */}
              <Card className="glass-card rounded-[2.5rem] border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-black"><CheckCircle2 className="h-4 w-4 text-primary" />Report Sections</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest">Select what to include in PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { key: "bookings", label: "Total Bookings", desc: "All booking transactions" },
                    { key: "penalty40", label: "40% Penalty & Refund", desc: "40% cancellation records" },
                    { key: "penalty80", label: "80/100% Penalty & Refund", desc: "80/100% cancellation records" },
                    { key: "settlement", label: "Successful Settlements", desc: "Completed & settlement payments" },
                    { key: "due", label: "Due Payment Collected", desc: "Due payment records" },
                    { key: "staff", label: "Staff Summary", desc: "Users & receptionists count" },
                  ] as const).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setReportSections(s => ({ ...s, [key]: !s[key] }))}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${reportSections[key] ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {reportSections[key] && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div><p className="text-xs font-black">{label}</p><p className="text-[10px] text-muted-foreground">{desc}</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Box 3 */}
              <Card className="glass-card rounded-[2.5rem] border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-black"><Calendar className="h-4 w-4 text-primary" />Report Period</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest">Select month to generate report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Month & Year</Label>
                    <Input type="month" className="rounded-xl bg-white/50 border-white/40 font-bold" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
                  </div>
                  {dashboard && reportMonth && (() => {
                    const [yr2, mo2] = reportMonth.split("-").map(Number);
                    const mp = dashboard.payments.filter(p => { const d = new Date(p.createdAt); return d.getFullYear()===yr2 && d.getMonth()+1===mo2; });
                    const mb = dashboard.bookings.filter(b => { const d = new Date(b.createdAt); return d.getFullYear()===yr2 && d.getMonth()+1===mo2; });
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-primary/5 rounded-xl p-3 text-center"><p className="text-[10px] font-black uppercase text-muted-foreground">Bookings</p><p className="text-xl font-black text-primary">{mb.length}</p></div>
                        <div className="bg-emerald-500/5 rounded-xl p-3 text-center"><p className="text-[10px] font-black uppercase text-muted-foreground">Revenue</p><p className="text-lg font-black text-emerald-600">৳{mp.reduce((s,p)=>s+p.amount,0).toFixed(0)}</p></div>
                      </div>
                    );
                  })()}
                  <Button className="w-full h-14 rounded-2xl font-black text-sm gap-2 shadow-2xl shadow-primary/20" onClick={async () => {
                    if (!dashboard || !reportMonth) return;
                    const { default: jsPDF } = await import("jspdf");
                    const autoTable = (await import("jspdf-autotable")).default;
                    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
                    const [yr, mo] = reportMonth.split("-").map(Number);
                    const monthName = new Date(yr, mo-1, 1).toLocaleString("en-US", { month: "long" });
                    const generatedAt = formatDateTime(new Date().toISOString());
                    const pageW = doc.internal.pageSize.getWidth();

                    let payments = dashboard.payments.filter(p => { const d = new Date(p.createdAt); return d.getFullYear()===yr && d.getMonth()+1===mo; });


                    const drawHeader = (title: string) => {
                      doc.setFillColor(15,23,42); doc.rect(0,0,pageW,22,"F");
                      doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("Smart Locker System",10,13);
                      doc.setFontSize(10); doc.text(title,pageW-10,13,{align:"right"});
                      doc.setFillColor(241,245,249); doc.rect(0,22,pageW,10,"F");
                      doc.setTextColor(71,85,105); doc.setFontSize(7); doc.setFont("helvetica","normal");
                      doc.text(`Report Period: ${monthName} ${yr}`,10,28); doc.text(`Generated: ${generatedAt}`,pageW-10,28,{align:"right"}); doc.setTextColor(0,0,0);
                    };
                    const drawSectionHeader = (title: string, y: number, color: [number,number,number]=[99,102,241]) => {
                      doc.setFillColor(...color); doc.rect(10,y,3,7,"F");
                      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(15,23,42); doc.text(title,16,y+5.5); return y+10;
                    };
                    const cols = ["#","Date & Time","Name","Phone","Locker #","Station","Type","Amount (BDT)"];
                    const makeRows = (data: typeof payments) => data.map((p,i)=>[i+1,formatDateTime((p as any).createdAt),(p as any).userName||"-",(p as any).userPhone||"-",`#${(p as any).lockerNumber||"-"}`,(p as any).stationName||"-",p.type.replace(/_/g," ").toUpperCase(),p.amount.toFixed(2)]);
                    const tStyle: any = { headStyles:{fillColor:[15,23,42],textColor:255,fontStyle:"bold",fontSize:7}, bodyStyles:{fontSize:7,cellPadding:2}, alternateRowStyles:{fillColor:[248,250,252]}, columnStyles:{0:{cellWidth:8},7:{halign:"right",fontStyle:"bold"}}, margin:{left:10,right:10}, tableLineColor:[226,232,240], tableLineWidth:0.1 };
                    const addSubtotal = (data: typeof payments, lastY: number) => {
                      const total = data.reduce((s,p)=>s+p.amount,0);
                      doc.setFillColor(241,245,249); doc.rect(10,lastY,pageW-20,8,"F");
                      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(15,23,42);
                      doc.text("SUBTOTAL",14,lastY+5.5); doc.text(`BDT ${total.toFixed(2)}`,pageW-12,lastY+5.5,{align:"right"}); doc.setTextColor(0,0,0); return lastY+10;
                    };

                    const hasPaymentSections = reportSections.bookings || reportSections.penalty40 || reportSections.penalty80 || reportSections.settlement || reportSections.due;
                    const totalRevenue = payments.reduce((s,p)=>s+p.amount,0);
                    const totalPenalties = payments.filter(p=>p.type.includes("penalty")).reduce((s,p)=>s+p.amount,0);
                    const totalRefunds = payments.filter(p=>p.type==="refund").reduce((s,p)=>s+p.amount,0);
                    const totalBookingsCt = dashboard.bookings.filter(b=>{const d=new Date(b.createdAt);return d.getFullYear()===yr&&d.getMonth()+1===mo;}).length;
                    let curY = 38;

                    if (hasPaymentSections) {
                      drawHeader(`MONTHLY REPORT — ${monthName.toUpperCase()} ${yr}`);
                      curY = 38;
                      const boxes = [{label:"Total Bookings",val:`${totalBookingsCt}`,color:[99,102,241] as [number,number,number]},{label:"Total Revenue",val:`BDT ${totalRevenue.toFixed(2)}`,color:[16,185,129] as [number,number,number]},{label:"Total Penalties",val:`BDT ${totalPenalties.toFixed(2)}`,color:[239,68,68] as [number,number,number]},{label:"Total Refunds",val:`BDT ${totalRefunds.toFixed(2)}`,color:[245,158,11] as [number,number,number]}];
                      const bw = (pageW-20)/4-3;
                      boxes.forEach((b,i)=>{const bx=10+i*(bw+4);doc.setFillColor(b.color[0],b.color[1],b.color[2]);doc.roundedRect(bx,curY,bw,18,3,3,"F");doc.setTextColor(255,255,255);doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(b.label,bx+bw/2,curY+6,{align:"center"});doc.setFontSize(9);doc.setFont("helvetica","bold");doc.text(b.val,bx+bw/2,curY+13,{align:"center"});});
                      curY+=24; doc.setTextColor(0,0,0);

                      if (reportSections.bookings) { const bd=payments.filter(p=>p.type==="booking_payment"); if(bd.length>0){ curY=drawSectionHeader("BOOKING PAYMENTS",curY,[99,102,241]); autoTable(doc,{startY:curY,head:[cols],body:makeRows(bd),...tStyle}); curY=addSubtotal(bd,(doc as any).lastAutoTable.finalY); } }
                      if (reportSections.penalty40) { const p40=payments.filter(p=>p.type==="40%_penalty"||(p.type==="refund"&&p.reason?.includes("40"))); if(p40.length>0){ if(curY>160){doc.addPage();drawHeader(`MONTHLY REPORT — ${monthName.toUpperCase()} ${yr}`);curY=38;} curY=drawSectionHeader("40% PENALTY & REFUND",curY,[239,68,68]); autoTable(doc,{startY:curY,head:[cols],body:makeRows(p40),...tStyle}); curY=addSubtotal(p40,(doc as any).lastAutoTable.finalY); } }
                      if (reportSections.penalty80) { const p80=payments.filter(p=>p.type==="80%_penalty"||p.type==="100%_penalty"||(p.type==="refund"&&(p.reason?.includes("80")||p.reason?.includes("100")))); if(p80.length>0){ if(curY>160){doc.addPage();drawHeader(`MONTHLY REPORT — ${monthName.toUpperCase()} ${yr}`);curY=38;} curY=drawSectionHeader("80% / 100% PENALTY & REFUND",curY,[220,38,38]); autoTable(doc,{startY:curY,head:[cols],body:makeRows(p80),...tStyle}); curY=addSubtotal(p80,(doc as any).lastAutoTable.finalY); } }
                      if (reportSections.settlement) { const settle=payments.filter(p=>p.type==="successful_settlement"); if(settle.length>0){ if(curY>160){doc.addPage();drawHeader(`MONTHLY REPORT — ${monthName.toUpperCase()} ${yr}`);curY=38;} curY=drawSectionHeader("SUCCESSFUL SETTLEMENTS",curY,[16,185,129]); autoTable(doc,{startY:curY,head:[cols],body:makeRows(settle),...tStyle}); curY=addSubtotal(settle,(doc as any).lastAutoTable.finalY); } }
                      if (reportSections.due) { const due=payments.filter(p=>p.type==="due_payment"); if(due.length>0){ if(curY>160){doc.addPage();drawHeader(`MONTHLY REPORT — ${monthName.toUpperCase()} ${yr}`);curY=38;} curY=drawSectionHeader("DUE PAYMENT COLLECTED",curY,[245,158,11]); autoTable(doc,{startY:curY,head:[cols],body:makeRows(due),...tStyle}); curY=addSubtotal(due,(doc as any).lastAutoTable.finalY); } }
                    }

                    if (reportSections.staff) {
                      if (hasPaymentSections) { doc.addPage(); } // Only add new page if payment pages exist; otherwise use page 1
                      drawHeader(`STAFF SUMMARY — ${monthName.toUpperCase()} ${yr}`); curY=38;
                      const tu=dashboard.users.length; const nu=dashboard.users.filter(u=>{const d=new Date((u as any).createdAt||0);return d.getFullYear()===yr&&d.getMonth()+1===mo;}).length;
                      const tr=dashboard.receptionists.length; const nr=dashboard.receptionists.filter(r=>{const d=new Date((r as any).createdAt||0);return d.getFullYear()===yr&&d.getMonth()+1===mo;}).length;
                      const sb=[{label:"Total Travelers",val:`${tu}`,color:[99,102,241] as [number,number,number]},{label:"New This Month",val:`${nu}`,color:[16,185,129] as [number,number,number]},{label:"Total Receptionists",val:`${tr}`,color:[245,158,11] as [number,number,number]},{label:"New This Month",val:`${nr}`,color:[139,92,246] as [number,number,number]}];
                      const sbw=(pageW-20)/4-3;
                      sb.forEach((b,i)=>{const bx=10+i*(sbw+4);doc.setFillColor(b.color[0],b.color[1],b.color[2]);doc.roundedRect(bx,curY,sbw,18,3,3,"F");doc.setTextColor(255,255,255);doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(b.label,bx+sbw/2,curY+6,{align:"center"});doc.setFontSize(11);doc.setFont("helvetica","bold");doc.text(b.val,bx+sbw/2,curY+13,{align:"center"});});
                      curY+=24; doc.setTextColor(0,0,0);
                      let fu=dashboard.users; // No phone filter — always show ALL travelers
                      curY=drawSectionHeader("REGISTERED TRAVELERS",curY,[99,102,241]);
                      autoTable(doc,{startY:curY,head:[["#","Name","Phone","Email","Address"]],body:fu.map((u,i)=>[i+1,u.name,(u as any).phone||"-",u.email||"-",(u as any).address||"-"]),...tStyle,columnStyles:{0:{cellWidth:8}}});
                      curY=(doc as any).lastAutoTable.finalY+8;
                      if(curY>160){doc.addPage();drawHeader(`STAFF SUMMARY — ${monthName.toUpperCase()} ${yr}`);curY=38;}
                      let fr=dashboard.receptionists; // No email filter — always show ALL receptionists
                      curY=drawSectionHeader("STATION RECEPTIONISTS",curY,[245,158,11]);
                      autoTable(doc,{startY:curY,head:[["#","Name","Station","Email"]],body:fr.map((r,i)=>[i+1,r.name,(r as any).stationName||"-",(r as any).email||"-"]),...tStyle,columnStyles:{0:{cellWidth:8}}});
                      curY=(doc as any).lastAutoTable.finalY+8;
                    }

                    const pages=(doc as any).internal.getNumberOfPages();
                    for(let i=1;i<=pages;i++){doc.setPage(i);const pH=doc.internal.pageSize.getHeight();doc.setFillColor(241,245,249);doc.rect(0,pH-10,pageW,10,"F");doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(100,116,139);doc.text(`Page ${i} of ${pages}`,pageW/2,pH-3,{align:"center"});doc.text("Smart Locker System — Confidential",10,pH-3);doc.text(`${monthName} ${yr} Report`,pageW-10,pH-3,{align:"right"});}
                    doc.save(`LockerGo_Report_${monthName}_${yr}.pdf`);
                  }}>
                    <Download className="h-4 w-4" /> Generate PDF Report
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">File: <span className="font-mono font-bold">LockerGo_Report_{reportMonth ? new Date(reportMonth+"-01").toLocaleString("en-US",{month:"long",year:"numeric"}) : "..."}.pdf</span></p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}


            {activeTab === "station-audit" && (
              <motion.div key="station-audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
                  <div className="flex-1 w-full max-w-2xl space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Find Terminal</Label>
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search by terminal name or destination..." 
                        className="h-16 pl-14 pr-6 rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl font-bold text-lg"
                        value={stationAuditSearch}
                        onChange={(e) => setStationAuditSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Terminal Status</Label>
                      <Select value={stationAuditFilter} onValueChange={(v: any) => setStationAuditFilter(v)}>
                        <SelectTrigger className="h-14 w-48 rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900/50 font-black">
                          <SelectValue placeholder="All Terminals" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20 bg-white/80 backdrop-blur-xl">
                          <SelectItem value="all">All Terminals</SelectItem>
                          <SelectItem value="live">Live Now</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  {/* Left: Station List */}
                  <div className="xl:col-span-4 space-y-4">
                    {isStationAuditLoading ? (
                      <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Reconstructing History...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {stationAuditList
                          .filter(s => {
                            const matchesSearch = s.name.toLowerCase().includes(stationAuditSearch.toLowerCase()) || 
                                                s.id.toLowerCase().includes(stationAuditSearch.toLowerCase());
                            const matchesFilter = stationAuditFilter === "all" || 
                                                (stationAuditFilter === "live" && !s.terminatedAt) ||
                                                (stationAuditFilter === "terminated" && s.terminatedAt);
                            return matchesSearch && matchesFilter;
                          })
                          .map(station => (
                            <motion.div
                              key={station.id}
                              onClick={() => setSelectedStationAudit(station)}
                              className={cn(
                                "p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border shadow-lg group",
                                selectedStationAudit?.id === station.id 
                                  ? "bg-primary text-white border-primary shadow-primary/20 scale-[1.02]" 
                                  : "bg-white dark:bg-slate-900/50 border-white/20 hover:border-primary/50"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-lg tracking-tight truncate pr-4">{station.name}</h4>
                                {station.terminatedAt ? (
                                  <Badge className="bg-red-500/10 text-red-500 border-none font-black text-[8px] uppercase">Terminated</Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase">Live</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-3 bg-current/30 rounded-full" />
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedStationAudit?.id === station.id ? "text-white/70" : "text-muted-foreground")}>
                                  {station.id}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-current/10">
                                <div className="text-center">
                                  <p className="text-[8px] font-black uppercase opacity-60">Lockers</p>
                                  <p className="text-sm font-black">{station.totalLockers}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[8px] font-black uppercase opacity-60">Price/hr</p>
                                  <p className="text-sm font-black">৳{Number(station.pricePerHour || 50)}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Station Details & Locker Grid */}
                  <div className="xl:col-span-8">
                    {selectedStationAudit ? (
                      <div className="space-y-8">
                        <Card className="rounded-[3rem] border-none shadow-2xl glass-card overflow-hidden">
                          <CardHeader className="p-10 border-b border-white/10">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={cn("px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border-none", selectedStationAudit.terminatedAt ? "bg-red-500 text-white" : "bg-emerald-500 text-white")}>
                                    {selectedStationAudit.terminatedAt ? "Terminal Offline" : "Terminal Online"}
                                  </Badge>
                                  {selectedStationAudit.terminatedAt && (
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-3">
                                      Deactivated on: {formatDateTime(selectedStationAudit.terminatedAt)}
                                    </span>
                                  )}
                                </div>
                                <CardTitle className="text-4xl font-black tracking-tighter">{selectedStationAudit.name}</CardTitle>
                                <CardDescription className="text-sm font-bold text-muted-foreground mt-2">{selectedStationAudit.address}</CardDescription>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Station ID</p>
                                <p className="text-xl font-mono font-black text-primary">{selectedStationAudit.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-10 space-y-12">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Units</p>
                                <p className="text-3xl font-black tracking-tighter">{selectedStationAudit.totalLockers}</p>
                              </div>
                              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Current Rate</p>
                                <p className="text-3xl font-black tracking-tighter">৳{selectedStationAudit.pricePerHour}</p>
                              </div>
                              <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Destination</p>
                                <p className="text-2xl font-black tracking-tighter truncate">{selectedStationAudit.destinationId}</p>
                              </div>
                              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Monitor Node</p>
                                <p className="text-2xl font-black tracking-tighter truncate">STN-X</p>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-xl font-black tracking-tight">Forensic Locker Grid</h5>
                                  <p className="text-xs font-bold text-muted-foreground">Select a unit to view its full operational history</p>
                                </div>
                                <div className="flex gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-md bg-primary/20 border border-primary/30" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Locker Unit</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                {Array.from({ length: selectedStationAudit.totalLockers }).map((_, i) => (
                                  <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setSelectedLockerForensic({ stationId: selectedStationAudit.id, number: i + 1 });
                                      fetchForensicData(selectedStationAudit.id, i + 1);
                                      setIsLockerForensicOpen(true);
                                    }}
                                    className="aspect-square rounded-2xl border border-primary/10 bg-primary/5 hover:bg-primary hover:text-white transition-all flex flex-col items-center justify-center gap-1 group shadow-sm"
                                  >
                                    <Box className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                                    <span className="text-xs font-black">#{i + 1}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="h-[600px] flex flex-col items-center justify-center glass-card rounded-[3rem] text-center p-12 space-y-6 border-dashed border-2 border-white/20">
                        <div className="p-8 rounded-[2.5rem] bg-primary/5">
                          <ShieldCheck className="h-16 w-16 text-primary/40" />
                        </div>
                        <div className="max-w-md">
                          <h3 className="text-2xl font-black tracking-tight mb-2">Select a Station Terminal</h3>
                          <p className="text-sm font-medium text-muted-foreground">Choose a station from the left to explore its visual locker grid and historical audit logs.</p>
                        </div>
                      </div>
                  )}
                </div>
              </div>
              </motion.div>
            )}
            {activeTab === "user-audit" && (
              <motion.div key="user-audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
                  <div className="flex-1 w-full max-w-2xl space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Find Traveler</Label>
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search by name, phone or email..." 
                        className="h-16 pl-14 pr-6 rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl font-bold text-lg"
                        value={userAuditSearch}
                        onChange={(e) => setUserAuditSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Audit Status</Label>
                      <Select value={userAuditFilter} onValueChange={(v: any) => setUserAuditFilter(v)}>
                        <SelectTrigger className="h-14 w-40 rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900/50 font-black">
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20 bg-white/80 backdrop-blur-xl">
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="present">Active</SelectItem>
                          <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Traveler Age</Label>
                      <Select value={userAuditCategory} onValueChange={(v: any) => setUserAuditCategory(v)}>
                        <SelectTrigger className="h-14 w-40 rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900/50 font-black">
                          <SelectValue placeholder="All Ages" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20 bg-white/80 backdrop-blur-xl">
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="new">New (&lt;1m)</SelectItem>
                          <SelectItem value="old">Old (&gt;1m)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  {/* Left: User List */}
                  <div className="xl:col-span-4 space-y-4">
                    {isUserAuditLoading ? (
                      <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Retrieving Identities...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {userAuditList
                          .filter(u => {
                            const search = userAuditSearch.toLowerCase();
                            const matchesSearch = u.name.toLowerCase().includes(search) || 
                                                u.phone.toLowerCase().includes(search) ||
                                                (u.email && u.email.toLowerCase().includes(search));
                            const matchesFilter = userAuditFilter === "all" || 
                                                (userAuditFilter === "present" && !u.isDeleted) ||
                                                (userAuditFilter === "deleted" && u.isDeleted);
                            const matchesCategory = userAuditCategory === "all" ||
                                                  (userAuditCategory === "new" && u.isNew) ||
                                                  (userAuditCategory === "old" && !u.isNew);
                            return matchesSearch && matchesFilter && matchesCategory;
                          })
                          .map(u => (
                            <motion.div
                              key={u.id}
                              onClick={() => {
                                setSelectedUserAudit(u);
                                fetchUserForensicData(u.id);
                              }}
                              className={cn(
                                "p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border shadow-lg group",
                                selectedUserAudit?.id === u.id 
                                  ? "bg-primary text-white border-primary shadow-primary/20 scale-[1.02]" 
                                  : "bg-white dark:bg-slate-900/50 border-white/20 hover:border-primary/50"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-lg tracking-tight truncate pr-4">{u.name}</h4>
                                <div className="flex gap-2">
                                  {u.isDeleted && <Badge className="bg-red-500/10 text-red-500 border-none font-black text-[8px] uppercase">Deleted</Badge>}
                                  {u.isNew && <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] uppercase">New</Badge>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-3 bg-current/30 rounded-full" />
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedUserAudit?.id === u.id ? "text-white/70" : "text-muted-foreground")}>
                                  {u.phone}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-current/10">
                                <p className="text-[10px] font-black uppercase opacity-60">Joined: {formatDateLocal(u.createdAt)}</p>
                                <UserCircle className="h-4 w-4 opacity-40" />
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right: User Overview */}
                  <div className="xl:col-span-8">
                    {selectedUserAudit ? (
                      <div className="space-y-8">
                        <Card className="rounded-[3rem] border-none shadow-2xl glass-card overflow-hidden">
                          <CardHeader className="p-10 border-b border-white/10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                                  <UserCircle className="h-12 w-12 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-4xl font-black tracking-tighter uppercase">{selectedUserAudit.name}</CardTitle>
                                  <CardDescription className="font-bold text-primary opacity-60">Audit ID: {selectedUserAudit.id}</CardDescription>
                                </div>
                              </div>
                              <Button 
                                onClick={() => setIsUserForensicModalOpen(true)}
                                className="rounded-2xl h-14 px-8 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20"
                              >
                                View Forensic Timeline
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-10">
                            {isUserForensicLoading ? (
                              <div className="py-20 flex flex-col items-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Scanning History...</p>
                              </div>
                            ) : userForensicData ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-primary/5 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Total Bookings</p>
                                  <p className="text-4xl font-black">{userForensicData.bookings.length}</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Total Contribution</p>
                                  <p className="text-4xl font-black text-emerald-600">৳{userForensicData.payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0)}</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-amber-500/5 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Audit Logs</p>
                                  <p className="text-4xl font-black text-amber-600">{userForensicData.audits.length}</p>
                                </div>
                                
                                <div className="md:col-span-3">
                                  <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" /> Recent Activity
                                  </h4>
                                  <div className="space-y-4">
                                    {userForensicData.audits.slice(0, 5).map((log: any) => (
                                      <div key={log.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-border/50">
                                        <div className="flex items-center gap-4">
                                          <div className="w-2 h-2 rounded-full bg-primary" />
                                          <div>
                                            <p className="text-xs font-black uppercase tracking-tighter">{log.actionType.replace('_', ' ')}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">{log.actorRole}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-20 text-center">
                                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Select a traveler to analyze.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-8 glass-card rounded-[4rem] border-dashed p-20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                          <div className="relative h-40 w-40 rounded-[3rem] bg-primary/5 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                            <Fingerprint className="h-20 w-20 text-primary opacity-20" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-3xl font-black tracking-tight mb-3">Identity Audit Node</h3>
                          <p className="text-sm font-medium text-muted-foreground leading-relaxed">Choose a traveler from the left to access their complete historical timeline, financial contributions, and provenance data.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* User Forensic Modal */}
      <Dialog open={isUserForensicModalOpen} onOpenChange={setIsUserForensicModalOpen}>
        <DialogContent className="max-w-6xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-slate-950">
          {isUserForensicLoading ? (
            <div className="h-[600px] flex flex-col items-center justify-center p-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
              <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Scanning Bio-Digital Records...</p>
            </div>
          ) : userForensicData && (
            <div className="flex flex-col h-[90vh]">
              {/* Modal Header */}
              <div className="p-12 bg-primary text-white space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 text-white border-none font-black text-[10px] tracking-widest uppercase px-4 py-1 rounded-full">Identity Forensic Node</Badge>
                      {selectedUserAudit.isDeleted && <Badge className="bg-red-500 text-white border-none font-black text-[10px] tracking-widest uppercase px-4 py-1 rounded-full">Deactivated Account</Badge>}
                    </div>
                    <h2 className="text-6xl font-black tracking-tighter uppercase">{selectedUserAudit.name}</h2>
                    <p className="text-white/60 font-black text-xs uppercase tracking-[0.2em]">{selectedUserAudit.phone} &bull; {selectedUserAudit.email || "NO EMAIL"}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
                      <div className="space-y-1 w-full sm:w-auto">
                        <p className="text-[8px] font-black uppercase text-white/40 ml-1">Archive Month</p>
                        <Input 
                          type="month" 
                          className="h-11 w-full sm:w-44 bg-white/10 border-white/20 text-white font-bold rounded-2xl text-xs focus:bg-white/20 transition-all" 
                          value={userForensicMonthFilter}
                          onChange={(e) => setUserForensicMonthFilter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 w-full sm:w-auto">
                        <p className="text-[8px] font-black uppercase text-white/40 ml-1">Specific Date</p>
                        <Input 
                          type="date" 
                          className="h-11 w-full sm:w-44 bg-white/10 border-white/20 text-white font-bold rounded-2xl text-xs focus:bg-white/20 transition-all"
                          value={userForensicDateFilter}
                          onChange={(e) => setUserForensicDateFilter(e.target.value)}
                        />
                      </div>
                      {(userForensicMonthFilter || userForensicDateFilter) && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setUserForensicMonthFilter("");
                            setUserForensicDateFilter("");
                          }}
                          className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 mt-3 sm:mt-0"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest italic pt-1 pr-1 italic">Authorized Forensic Access ONLY</p>
                  </div>
                </div>
              </div>

              {/* Modal Content Area */}
              <div className="flex-1 overflow-auto p-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Timeline & Grid */}
                  <div className="lg:col-span-8 space-y-16">
                    {/* 1. Terminal Usage Grid */}
                    <section className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1 bg-blue-500 rounded-full" />
                          <h3 className="text-xl font-black tracking-tight uppercase">Station Interactivity Grid</h3>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{new Set(userForensicData.bookings.map((b: any) => b.stationName)).size} Terminals Utilized</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from(new Set(userForensicData.bookings.map((b: any) => `${b.stationName}|${b.lockerNumber}`))).map((pair: any, idx) => {
                          const [stationName, lockerNumber] = pair.split('|');
                          const isSelected = selectedForensicLocker === pair;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedForensicLocker(isSelected ? null : pair)}
                              className={cn(
                                "p-4 rounded-2xl border shadow-sm text-center group transition-all cursor-pointer",
                                isSelected 
                                  ? "bg-primary text-white border-primary shadow-primary/30" 
                                  : "bg-white dark:bg-slate-900 border-border/50 hover:border-primary/30"
                              )}
                            >
                              <p className={cn("text-[8px] font-black uppercase mb-1 transition-colors", isSelected ? "text-white/70" : "text-muted-foreground")}>{stationName}</p>
                              <p className={cn("text-lg font-black transition-colors", isSelected ? "text-white" : "text-primary")}>Locker {lockerNumber}</p>
                            </div>
                          );
                        })}
                        {userForensicData.bookings.length === 0 && (
                          <div className="col-span-full py-10 text-center rounded-3xl bg-muted/20 border-dashed border-2 border-border">
                            <p className="text-xs font-bold text-muted-foreground italic">No terminal interactions recorded.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 2. Full Booking Timeline */}
                    <section className="space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h3 className="text-xl font-black tracking-tight uppercase">Historical Booking Timeline</h3>
                      </div>
                      <div className="space-y-6">
                        {userForensicData.bookings
                          .filter((b: any) => {
                            if (userForensicMonthFilter && !formatMonthLocal(b.createdAt).includes(userForensicMonthFilter)) return false;
                            if (userForensicDateFilter && !formatDateLocal(b.createdAt).includes(userForensicDateFilter)) return false;
                            if (selectedForensicLocker && `${b.stationName}|${b.lockerNumber}` !== selectedForensicLocker) return false;
                            return true;
                          })
                          .map((b: any) => (
                            <div key={b.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-border/50 shadow-xl group hover:border-primary transition-all overflow-hidden relative">
                              <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Box className="h-16 w-16" />
                              </div>
                              <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest">{b.status.replace('_', ' ')}</Badge>
                                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDateTime(b.createdAt)}</span>
                                    </div>
                                    <h4 className="text-2xl font-black tracking-tighter">{b.stationName} Locker {b.lockerNumber}</h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-8 pt-2">
                                    <div>
                                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Check-In Event</p>
                                      <p className="text-xs font-black">{b.actualCheckInTime ? formatDateTime(b.actualCheckInTime) : (b.status === 'cancelled' ? 'N/A' : 'Pending')}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Return Event</p>
                                      <p className="text-xs font-black">{b.actualCheckOutTime ? formatDateTime(b.actualCheckOutTime) : 'Ongoing'}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="md:text-right flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Settlement Value</p>
                                    <p className="text-3xl font-black text-primary">৳{b.amount}</p>
                                  </div>
                                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic pt-4">Locker Index: {b.lockerId}</p>
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Payments & Audits */}
                  <div className="lg:col-span-4 space-y-12">
                    {/* 3. Financial Ledger */}
                    <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white p-10 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <CreditCard className="h-20 w-20" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" /> Financial Audit
                      </h4>
                      <div className="space-y-8">
                        {userForensicData.payments.slice(0, 10).map((p: any) => (
                          <div key={p.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                            <div className="absolute left-[-3px] top-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">{formatDateTime(p.createdAt)}</p>
                                <p className="text-xs font-black uppercase tracking-tighter">{p.type.replace('_', ' ')}</p>
                              </div>
                              <p className="text-sm font-black text-emerald-400">৳{p.amount}</p>
                            </div>
                          </div>
                        ))}
                        {userForensicData.payments.length === 0 && (
                          <p className="text-[10px] font-bold text-white/40 italic">No historical transactions found.</p>
                        )}
                      </div>
                    </Card>

                    {/* 4. Full Audit Trail */}
                    <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 p-10">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Provenance Logs
                      </h4>
                      <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10">
                        {userForensicData.audits.map((log: any) => {
                          const actionLabel = log.actionType.toLowerCase();
                          let icon = <Activity className="h-4 w-4" />;
                          let color = "bg-primary";
                          let detail = log.details || "";

                          if (actionLabel.includes('login')) { icon = <Activity className="h-4 w-4 text-emerald-500" />; color = "bg-emerald-500"; }
                          if (actionLabel.includes('logout')) { icon = <LogOut className="h-4 w-4 text-slate-500" />; color = "bg-slate-500"; }
                          if (actionLabel.includes('booking')) { icon = <Package className="h-4 w-4 text-blue-500" />; color = "bg-blue-500"; }
                          if (actionLabel.includes('payment')) { icon = <DollarSign className="h-4 w-4 text-emerald-600" />; color = "bg-emerald-600"; }
                          if (actionLabel.includes('penalty')) { icon = <AlertCircle className="h-4 w-4 text-red-500" />; color = "bg-red-500"; }
                          if (actionLabel.includes('refund')) { icon = <DollarSign className="h-4 w-4 text-amber-500" />; color = "bg-amber-500"; }
                          if (actionLabel.includes('profile')) { icon = <UserCircle className="h-4 w-4 text-indigo-500" />; color = "bg-indigo-500"; }
                          if (actionLabel.includes('delete')) { icon = <Trash2 className="h-4 w-4 text-red-600" />; color = "bg-red-600"; }

                          return (
                            <div key={log.id} className="relative pl-8 group">
                              <div className={cn("absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 z-10 transition-transform group-hover:scale-125", color)} />
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDateTime(log.createdAt)}</p>
                                <Badge className={cn("text-[8px] font-black uppercase tracking-tighter border-none text-white", color)}>
                                  {log.actionType.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border/50 group-hover:border-primary/20 transition-colors">
                                <p className="text-xs font-bold leading-relaxed">{log.description || `System recorded ${log.actionType.toLowerCase()} on ${log.entityType} ${log.entityId}`}</p>
                                {log.metadata && (
                                  <pre className="mt-2 text-[9px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 p-2 rounded-lg overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

  // ── Real-time: stable callback â†’ no socket leaks ───────
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
    : "0.0";

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
                          {formatDateTime(review.createdAt)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatDateTime(review.createdAt)}
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

