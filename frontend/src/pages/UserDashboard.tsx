import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetSmartTouristBootstrap,
  useGetSmartTouristUserDashboard,
  getGetSmartTouristUserDashboardQueryKey,
  useRequestSmartTouristBookingOtp,
  useConfirmSmartTouristBookingOtp,
  useCancelSmartTouristBooking,
  useExtendSmartTouristBooking,
  useRequestSmartTouristKey,
  useReturnSmartTouristKey,
  useUpdateSmartTouristUserProfile,
  Station,
  Locker,
  Booking,
  PaymentRecord
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, MapPin, XCircle, Key, LogOut, CreditCard, User, History, Search, AlertCircle, Star, Menu, X } from "lucide-react";
import { cn, useRealtime, formatDateLocal, formatMonthLocal, getDateTimeLocal, formatDateTime } from "@/lib/utils";

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

export default function UserDashboard() {
  const { role, userId, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: bootstrapData, isLoading: isBootstrapLoading } = useGetSmartTouristBootstrap();
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingStation, setBookingStation] = useState<Station | null>(null);
  const [activeTab, setActiveTab] = useState<string>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleReset = () => setActiveTab("main");
    window.addEventListener("smart-tourist-reset-dashboard", handleReset);
    return () => window.removeEventListener("smart-tourist-reset-dashboard", handleReset);
  }, []);

  const { data: dashboard, isLoading } = useGetSmartTouristUserDashboard(userId || "", {
    query: { 
      enabled: role === "user" && !!userId, 
      queryKey: getGetSmartTouristUserDashboardQueryKey(userId || ""),
      refetchInterval: 2000
    }
  });

  const filteredStations = useMemo(() => {
    if (!bootstrapData) return [];
    return (bootstrapData?.stations || []).filter((station: any) => {
      const matchesDest = selectedDestination === "all" || station.destinationId === selectedDestination;
      const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            station.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDest && matchesSearch;
    });
  }, [bootstrapData, selectedDestination, searchQuery]);

  useEffect(() => {
    if (role !== "user" || !userId) setLocation("/");
  }, [role, userId, setLocation]);

  if (role !== "user" || !userId) return null;

  if (isLoading || isBootstrapLoading) return <DashboardSkeleton />;

  if (!dashboard || !bootstrapData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "active":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Active Bookings</h2>
            </div>
            {dashboard.activeBookings.length === 0 ? (
              <Card className="glass-card rounded-[2.5rem] border-dashed">
                <CardContent className="p-20 text-center space-y-4">
                  <div className="inline-block p-6 rounded-full bg-muted/20">
                    <Clock className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No active bookings found. Explore stations to book your first locker!</p>
                  <Button onClick={() => setActiveTab("main")} className="rounded-xl font-bold">Find Stations</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {dashboard.activeBookings.map((booking: any) => <BookingCard key={booking.id} booking={booking} userId={userId} />)}
              </div>
            )}
          </motion.div>
        );
      case "history":
        return <BookingHistoryInline history={dashboard.history} />;
      case "payments":
        return <PaymentRefundsInline payments={dashboard.payments} />;
      case "reviews":
        return <ReviewsInline userId={userId} userName={user?.name || "Traveler"} />;
      case "profile":
        return <UserProfileForm userId={userId} user={dashboard.user} />;
      default:
        return (
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-end shadow-2xl shadow-primary/5"
            >
              <div className="flex-1 space-y-2 w-full">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Quick Search</Label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search stations or regions..."
                    className="pl-12 h-14 bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 rounded-2xl focus-visible:ring-primary/20 text-lg font-medium"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-[280px] space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Region</Label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger className="h-14 bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 rounded-2xl focus:ring-primary/20 text-lg font-medium">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl">
                    <SelectItem value="all">All Destinations</SelectItem>
                    {bootstrapData.destinations.map((dest: any) => (
                      <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStations.map((station: any) => (
                <StationCard
                  key={station.id}
                  station={station}
                  lockers={bootstrapData.lockers.filter((locker: any) => locker.stationId === station.id)}
                  destinationName={bootstrapData.destinations.find((d: any) => d.id === station.destinationId)?.name || ""}
                  onBook={() => setBookingStation(station)}
                />
              ))}
              {filteredStations.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground glass-card rounded-[2.5rem] border-dashed">
                  No stations found matching your criteria.
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const sidebarLinks = [
    { id: "main", label: "Dashboard", icon: Search },
    { id: "active", label: "Active Stays", icon: Clock },
    { id: "history", label: "Trip Archive", icon: History },
    { id: "payments", label: "Financials", icon: CreditCard },
    { id: "reviews", label: "My Reviews", icon: Star },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`w-80 border-r border-white/40 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-3xl p-8 flex-col gap-12 shadow-2xl xl:relative ${sidebarOpen ? 'flex fixed top-0 left-0 h-full z-50 overflow-y-auto' : 'hidden xl:flex'}`}
      >
        <div className="xl:hidden flex justify-end mb-2">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="px-4 mb-8">
            <h1 className="text-2xl font-black tracking-tighter">Traveler <span className="text-primary">Hub</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">User v3.0 Pro Max</p>
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
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">{user?.name}</p>
              <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/20">Traveler</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-2xl font-black border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all shadow-xl" onClick={() => window.dispatchEvent(new CustomEvent("smart-tourist-logout"))}>
            <LogOut className="h-4 w-4 mr-2" /> EXIT SYSTEM
          </Button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto relative perspective-1000">
        <div className="xl:hidden flex items-center gap-4 p-4 pt-6">
          <button onClick={() => setSidebarOpen(true)} className="p-3 rounded-2xl glass-card border-white/20 shadow-xl hover:bg-primary/10 transition-colors">
            <Menu className="h-6 w-6 text-primary" />
          </button>
          <span className="font-black text-lg tracking-tight">{sidebarLinks.find(l => l.id === activeTab)?.label}</span>
        </div>

        <div className="p-4 md:p-12 max-w-[1600px] mx-auto min-h-full space-y-12">
          {activeTab === "main" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex items-end justify-between border-b border-primary/10 pb-8">
                <div>
                  <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">My Traveler Panel</h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Welcome back, {user?.name}. We've missed your adventures!</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-4">
                {dashboard.metrics.map((m: any) => {
                  const isRefund = m.label === "Refunds";
                  const isPenalty = m.label === "Penalty Paid";
                  const isHistory = m.label === "Completed trips";
                  const isPayments = m.label === "Due payment";
                  const label = isRefund ? "Refunds" : isPenalty ? "Penalties" : isHistory ? "Completed trips" : isPayments ? "Due payment" : "Ongoing Stays";
                  const tabKey = (isRefund || isPenalty) ? "payments" : isHistory ? "history" : isPayments ? "payments" : "active";
                  const Icon = isHistory ? History : isPayments ? CreditCard : isRefund ? CreditCard : isPenalty ? AlertCircle : Clock;

                  return (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass-card p-8 rounded-[2.5rem] border-white/20 shadow-xl flex flex-col justify-between cursor-pointer group"
                      onClick={() => setActiveTab(tabKey)}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                        <h3 className="text-4xl font-black tracking-tighter">
                          {isPayments ? `৳${m.value}` : m.value}
                        </h3>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {renderContent()}
            </motion.div>
          )}

          {activeTab !== "main" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <LockerBookingModal
        station={bookingStation}
        lockers={bookingStation ? bootstrapData.lockers.filter((locker: any) => locker.stationId === bookingStation.id) : []}
        open={!!bookingStation}
        onOpenChange={(open) => !open && setBookingStation(null)}
        userId={userId}
        onSuccess={() => {
          queryClient.invalidateQueries();
          setActiveTab("active");
        }}
      />
    </div>
  );
}

function BookingHistoryInline({ history }: { history: Booking[] }) {
  const [filterType, setFilterType] = useState<"all" | "day" | "month">("all");
  const [filterValue, setFilterValue] = useState("");

  const filteredHistory = useMemo(() => {
    if (filterType === "all" || !filterValue) return history;
    return history.filter(item => {
      if (filterType === "day") return formatDateLocal(item.createdAt) === filterValue;
      return formatMonthLocal(item.createdAt) === filterValue;
    });
  }, [history, filterType, filterValue]);

  return (
    <Card className="glass-card rounded-[2.5rem] border-white/20 overflow-hidden shadow-2xl">
      <CardHeader className="bg-primary/5 p-8 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-3xl font-black tracking-tighter">Trip Archive</CardTitle>
          <CardDescription className="font-medium">Every journey you've taken with our smart locker network.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setFilterValue(""); }}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl bg-white/50 dark:bg-black/20 font-bold border-white/40">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="day">Specific Day</SelectItem>
              <SelectItem value="month">Specific Month</SelectItem>
            </SelectContent>
          </Select>

          {filterType !== "all" && (
            <Input 
              type={filterType === "day" ? "date" : "month"} 
              className="w-full sm:w-[200px] h-12 rounded-xl bg-white/50 dark:bg-black/20 font-bold border-white/40" 
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
        </div>

        <div className="rounded-[2rem] border border-white/40 dark:border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b-white/40">
                  <TableHead className="font-black text-xs uppercase tracking-widest p-6">Location</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest p-6">Locker Unit</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest p-6">Booking Date</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest p-6">Total Cost</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest p-6">Current Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item: any) => (
                  <TableRow key={item.id} className="border-b-white/40 hover:bg-white/10 transition-colors">
                    <TableCell className="font-bold p-6">{item.stationName}</TableCell>
                    <TableCell className="p-6 font-medium">Unit #{item.lockerNumber}</TableCell>
                    <TableCell className="p-6 text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell className="font-black text-lg text-primary p-6">৳{Number(item.totalAmount || 0).toFixed(2) || Number(item.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="p-6">
                      <Badge className={`px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest ${item.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic font-medium">
                      No trip records found for your selection.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentRefundsInline({ payments }: { payments: PaymentRecord[] }) {
  const [filterType, setFilterType] = useState<"all" | "day" | "month">("all");
  const [filterValue, setFilterValue] = useState("");

  const filteredPayments = useMemo(() => {
    let result = payments;
    if (filterType !== "all" && filterValue) {
      result = result.filter(item => {
        if (filterType === "day") return formatDateLocal(item.createdAt) === filterValue;
        return formatMonthLocal(item.createdAt) === filterValue;
      });
    }
    return result;
  }, [payments, filterType, filterValue]);

  const sections = {
    preCancel: filteredPayments.filter(p => p.type === "40%_penalty" || (p.type === "refund" && (p as any).reason?.includes("40"))),
    postCancel: filteredPayments.filter(p => p.type === "80%_penalty" || p.type === "100%_penalty" || (p.type === "refund" && ((p as any).reason?.includes("80") || (p as any).reason?.includes("100")))),
    fullPayment: filteredPayments.filter(p => p.type === "booking_payment" || p.type === "successful_settlement"),
    duePayment: filteredPayments.filter(p => p.type === "due_payment")
  };

  const PaymentTable = ({ data }: { data: PaymentRecord[] }) => (
    <div className="rounded-[2rem] border border-white/40 dark:border-white/10 overflow-hidden bg-white/30 dark:bg-black/20 backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b-white/40">
            <TableHead className="font-black text-xs uppercase tracking-widest p-6">Transaction ID</TableHead>
            <TableHead className="font-black text-xs uppercase tracking-widest p-6">Details</TableHead>
            <TableHead className="font-black text-xs uppercase tracking-widest p-6">Timestamp</TableHead>
            <TableHead className="text-right font-black text-xs uppercase tracking-widest p-6">Net Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="border-b-white/40 hover:bg-white/10 transition-colors">
              <TableCell className="p-6 font-mono text-xs opacity-60">TXN-{item.id.slice(-8).toUpperCase()}</TableCell>
              <TableCell className="p-6">
                <div className="font-bold text-sm">{(item as any).stationName || "System Update"}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.reason}</div>
              </TableCell>
              <TableCell className="p-6 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
              <TableCell className={`p-6 text-right font-black text-xl ${item.type.includes('penalty') ? 'text-destructive' : 'text-primary'}`}>
                {item.type.includes('penalty') ? '-' : '+'}৳{Number(item.amount || 0).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic font-medium">
                No financial history found in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="glass-card rounded-[2.5rem] border-white/20 overflow-hidden shadow-2xl">
      <CardHeader className="bg-primary/5 p-8 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-3xl font-black tracking-tighter">Financial Dashboard</CardTitle>
          <CardDescription className="font-medium">Audit logs of all payments, refunds, and adjustments.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setFilterValue(""); }}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl bg-white/50 dark:bg-black/20 font-bold border-white/40">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="day">Specific Day</SelectItem>
              <SelectItem value="month">Specific Month</SelectItem>
            </SelectContent>
          </Select>
          {filterType !== "all" && (
            <Input 
              type={filterType === "day" ? "date" : "month"} 
              className="w-full sm:w-[200px] h-12 rounded-xl bg-white/50 dark:bg-black/20 font-bold border-white/40" 
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
        </div>

        <Tabs defaultValue="full" className="space-y-8">
          <TabsList className="flex flex-wrap h-auto p-2 gap-2 bg-muted/20 rounded-2xl border border-white/10">
            <TabsTrigger value="pre" className="flex-1 min-w-[120px] rounded-xl font-black text-[10px] uppercase tracking-widest py-3">40% Penalty & Refund</TabsTrigger>
            <TabsTrigger value="post" className="flex-1 min-w-[120px] rounded-xl font-black text-[10px] uppercase tracking-widest py-3">80% / 100% Penalty & Refund</TabsTrigger>
            <TabsTrigger value="full" className="flex-1 min-w-[120px] rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Payments</TabsTrigger>
            <TabsTrigger value="due" className="flex-1 min-w-[120px] rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Dues</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key="table-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="pre" className="m-0 focus-visible:ring-0"><PaymentTable data={sections.preCancel} /></TabsContent>
              <TabsContent value="post" className="m-0 focus-visible:ring-0"><PaymentTable data={sections.postCancel} /></TabsContent>
              <TabsContent value="full" className="m-0 focus-visible:ring-0"><PaymentTable data={sections.fullPayment} /></TabsContent>
              <TabsContent value="due" className="m-0 focus-visible:ring-0"><PaymentTable data={sections.duePayment} /></TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StationCard({ station, lockers, destinationName, onBook }: { station: Station, lockers: Locker[], destinationName: string, onBook: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="h-full flex flex-col overflow-hidden border-white/40 dark:border-white/10 glass-card rounded-[2.5rem] transition-all group hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative h-40 overflow-hidden bg-muted/30">
          <img 
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${station.name}&backgroundColor=6366f1,3b82f6`} 
            alt={station.name}
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 right-4">
            <Badge className={`px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg ${station.availableLockers > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {station.availableLockers} Free
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{destinationName}</span>
            </div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-2xl font-black tracking-tight leading-tight">{station.name}</h3>
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-primary">৳{Number(station.pricePerHour || 50)}</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground -mt-1">/ Hour</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
              {station.address}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border border-white/40 dark:border-white/10 rounded-2xl p-4 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-lg font-black text-primary">{station.totalLockers}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Units</div>
            </div>
            <div className="text-center border-x border-white/40 dark:border-white/10">
              <div className="text-lg font-black text-orange-500">{station.bookedLockers}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-blue-500">{station.processingLockers}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Active</div>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-primary/20 ripple" 
            onClick={onBook}
            disabled={station.availableLockers === 0}
          >
            {station.availableLockers === 0 ? "Closed" : "Book Unit"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LockerBookingModal({ station, lockers, open, onOpenChange, userId, onSuccess }: { station: Station | null, lockers: Locker[], open: boolean, onOpenChange: (open: boolean) => void, userId: string, onSuccess?: () => void }) {
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [durationHours, setDurationHours] = useState("4");
  const [checkInTime, setCheckInTime] = useState(() => getDateTimeLocal());
  const [otpId, setOtpId] = useState("");
  const [otp, setOtp] = useState("");
  const requestOtp = useRequestSmartTouristBookingOtp();
  const confirmOtp = useConfirmSmartTouristBookingOtp();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const duration = Math.max(1, parseInt(durationHours) || 1);
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkIn.getTime() + duration * 60 * 60 * 1000);
  const totalCost = duration * (station?.pricePerHour || 50);

  const reset = () => {
    setSelectedLocker(null);
    setShowForm(false);
    setDurationHours("4");
    setCheckInTime(getDateTimeLocal());
    setOtpId("");
    setOtp("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !selectedLocker || !userId) return;
    requestOtp.mutate({
      data: { userId, stationId: station.id, lockerId: selectedLocker.id, durationHours: duration, checkInTime: checkIn.toISOString() }
    }, {
      onSuccess: (data: any) => {
        setOtpId(data.otpId);
        toast({ title: "OTP Sent", description: data.message });
      },
      onError: (err: any) => {
        toast({ title: "Request Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleConfirmOtp = (e: React.FormEvent) => {
    e.preventDefault();
    confirmOtp.mutate({ data: { otpId, otp } }, {
      onSuccess: () => {
        toast({ title: "Booking Confirmed", description: "Your locker is ready!" });
        queryClient.invalidateQueries();
        handleOpenChange(false);
        onSuccess?.();
      },
      onError: (err: any) => {
        toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const lockerColor = (locker: Locker) => {
    if (locker.status === "available") return "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/30";
    if (locker.status === "occupied" || locker.status === "processing") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 cursor-not-allowed";
    return "bg-red-500/10 text-red-600 border-red-500/20 cursor-not-allowed";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col rounded-[2.5rem] border-white/20 glass-card p-0 overflow-hidden shadow-2xl scale-100">
          <div className="bg-primary/5 p-10 border-b border-white/10">
            <DialogTitle className="text-4xl font-black tracking-tighter">Locker Selection</DialogTitle>
            <DialogDescription className="text-lg font-medium text-muted-foreground mt-1">Pick a vacant unit at {station?.name} to start your session.</DialogDescription>
          </div>
          <div className="p-10 space-y-10">
            {station && (
              <div className="max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                  {lockers.map(locker => (
                    <motion.button
                      key={locker.id}
                      whileHover={locker.status === "available" ? { scale: 1.1, y: -2 } : {}}
                      whileTap={locker.status === "available" ? { scale: 0.95 } : {}}
                      type="button"
                      disabled={locker.status !== "available"}
                      onClick={() => { setSelectedLocker(locker); setShowForm(true); }}
                      className={`h-11 flex items-center justify-center rounded-xl text-sm font-black border-2 transition-all duration-300 ${lockerColor(locker)} ${selectedLocker?.id === locker.id ? "ring-4 ring-primary ring-offset-2 scale-105" : ""}`}
                    >
                      {locker.number}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-8 justify-center p-6 rounded-3xl bg-white/30 dark:bg-black/20 border border-white/20 backdrop-blur-md">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><div className="w-4 h-4 rounded-full bg-green-500 shadow-xl shadow-green-500/40" /> Available</div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><div className="w-4 h-4 rounded-full bg-red-500 shadow-xl shadow-red-500/40" /> Reserved</div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><div className="w-4 h-4 rounded-full bg-yellow-500 shadow-xl shadow-yellow-500/40" /> Active</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(nextOpen) => { setShowForm(nextOpen); if (!nextOpen && !otpId) setSelectedLocker(null); }}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-white/20 glass-card p-0 overflow-hidden shadow-2xl">
          <div className="bg-primary/5 p-10 border-b border-white/10">
            <DialogTitle className="text-4xl font-black tracking-tighter">Booking Portal</DialogTitle>
            <DialogDescription className="font-bold text-primary mt-1">Locker #{selectedLocker?.number} • {station?.name}</DialogDescription>
          </div>
          <div className="p-10">
            {selectedLocker && station && (
              <form onSubmit={otpId ? handleConfirmOtp : handleRequestOtp} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hourly Rent</Label>
                    <div className="h-14 flex items-center px-6 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 font-black text-xl">৳{Number(station?.pricePerHour || 50).toFixed(2)}</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Total Due</Label>
                    <div className="h-14 flex items-center px-6 rounded-2xl bg-primary/10 border-2 border-primary/30 font-black text-2xl text-primary shadow-lg shadow-primary/10 animate-pulse">৳{totalCost}</div>
                  </div>
                  <div className="space-y-3 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Check-in Time</Label>
                    <Input type="datetime-local" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} disabled={!!otpId} className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg focus-visible:ring-primary/20" />
                  </div>
                  <div className="space-y-3 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stay Duration (Hours)</Label>
                    <Input type="number" min="1" max="24" value={durationHours} onChange={e => setDurationHours(e.target.value)} disabled={!!otpId} className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg focus-visible:ring-primary/20" />
                  </div>
                </div>

                <AnimatePresence>
                  {otpId && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Security Token (OTP)</Label>
                      <Input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="••••••" required className="h-20 rounded-2xl text-center tracking-[1.5rem] text-4xl font-black bg-primary/5 border-2 border-primary/30" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 pt-4">
                  {!otpId && <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setShowForm(false)}>Cancel</Button>}
                  <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 ripple" disabled={requestOtp.isPending || confirmOtp.isPending}>
                    {(requestOtp.isPending || confirmOtp.isPending) ? <Loader2 className="h-6 w-6 animate-spin" /> : (otpId ? "Complete Payment" : "Verify & Proceed")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BookingCard({ booking, userId }: { booking: Booking, userId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancelBooking = useCancelSmartTouristBooking();
  const extendBooking = useExtendSmartTouristBooking();
  const requestKey = useRequestSmartTouristKey();
  const returnKey = useReturnSmartTouristKey();
  
  const [extendHours, setExtendHours] = useState("1");
  const [showExtend, setShowExtend] = useState(false);
  const [showCancelPreview, setShowCancelPreview] = useState(false);
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null);
  const [showDueModal, setShowDueModal] = useState(false);
  const [isProcessingDue, setIsProcessingDue] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetSmartTouristUserDashboardQueryKey(userId) });

  const handleCancelClick = async () => {
    try {
      const res = await fetch(`/api/smart-tourist/bookings/${booking.id}/cancel/preview`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to get cancellation preview.");
      const data = await res.json();
      setCancelPreviewData(data);
      setShowCancelPreview(true);
    } catch (err: any) {
      toast({ title: "Preview Failed", description: err.message, variant: "destructive" });
    }
  };

  const handlePayDue = async () => {
    setIsProcessingDue(true);
    try {
      const res = await fetch(`/api/smart-tourist/bookings/${booking.id}/pay-due`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error("Payment failed.");
      const data = await res.json();
      toast({ title: "Payment Successful", description: data.message });
      setShowDueModal(false);
      refresh();
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessingDue(false);
    }
  };

  const handleAction = (action: 'cancel' | 'request' | 'return' | 'extend') => {
    const opts = {
      onSuccess: (data: any) => {
        if (action === 'return' && data.requiresPayment) { setShowDueModal(true); return; }
        toast({ title: "Success", description: data?.message });
        refresh();
        setShowExtend(false);
        setShowCancelPreview(false);
      },
      onError: (err: any) => {
        toast({ title: "Action Failed", description: err.message, variant: "destructive" });
      }
    };

    if (action === 'cancel') cancelBooking.mutate({ bookingId: booking.id, data: { actorId: userId, actorRole: "user" } }, opts);
    else if (action === 'request') requestKey.mutate({ bookingId: booking.id, data: { actorId: userId, actorRole: "user" } }, opts);
    else if (action === 'return') returnKey.mutate({ bookingId: booking.id, data: { actorId: userId, actorRole: "user" } }, opts);
    else if (action === 'extend') extendBooking.mutate({ bookingId: booking.id, data: { actorId: userId, extraHours: parseInt(extendHours) } }, opts);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20">Live</Badge>;
      case 'overdue_due': return <Badge className="bg-red-500 animate-pulse font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20">Overdue</Badge>;
      case 'return_requested': return <Badge className="bg-primary font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">Finalizing</Badge>;
      default: return <Badge variant="outline" className="font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest border-2">{status}</Badge>;
    }
  };

  return (
    <>
      <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <Card className="rounded-[2.5rem] border-white/40 dark:border-white/10 glass-card overflow-hidden h-full flex flex-col group transition-all hover:shadow-2xl hover:shadow-primary/5">
          <div className="p-8 bg-primary/5 border-b border-white/10 relative">
            <div className="flex justify-between items-start mb-4">
              <div className="h-16 w-16 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              {getStatusBadge(booking.status)}
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-1">Unit #{booking.lockerNumber}</h3>
            <p className="text-xs font-black uppercase tracking-widest text-primary/60 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {booking.stationName}
            </p>
          </div>
          
          <CardContent className="p-8 space-y-4 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-muted-foreground">Checkout</span>
                <span className="font-black">{formatDateTime(booking.checkOutTime)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-muted-foreground">Booking Date</span>
                <span className="font-black">{formatDateTime(booking.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investment</span>
                <span className="text-2xl font-black text-primary">৳{booking.amount}</span>
              </div>
            </div>

            {booking.dueAmount > 0 && (
              <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }} className="bg-destructive/10 p-4 rounded-2xl border-2 border-destructive/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Overtime Payment Required</p>
                <p className="text-2xl font-black text-destructive">৳{Number(booking.dueAmount || 0).toFixed(2)}</p>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="p-8 pt-0">
            {showExtend ? (
              <div className="w-full flex gap-3 p-2 rounded-2xl bg-white/30 border border-white/40">
                <Input type="number" min="1" value={extendHours} onChange={e => setExtendHours(e.target.value)} className="w-20 h-12 rounded-xl bg-transparent border-none text-center font-black text-lg" />
                <Button onClick={() => handleAction('extend')} className="flex-1 h-12 rounded-xl font-black ripple">Confirm</Button>
                <Button variant="ghost" onClick={() => setShowExtend(false)} className="h-12 w-12 rounded-xl p-0"><XCircle className="h-6 w-6 text-muted-foreground" /></Button>
              </div>
            ) : (
              <div className="w-full flex gap-3">
                {booking.status === "pending" && (
                  <>
                    <Button size="lg" onClick={() => handleAction('request')} className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 ripple">
                      <Key className="mr-2 h-6 w-6" /> Unlock Now
                    </Button>
                    <Button variant="outline" onClick={handleCancelClick} className="h-14 w-14 rounded-2xl border-2 border-destructive/20 text-destructive hover:bg-destructive/5">
                      <XCircle className="h-8 w-8" />
                    </Button>
                  </>
                )}
                {booking.status === "active" && (
                  <>
                    <Button size="lg" onClick={() => handleAction('return')} className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 ripple">
                      <LogOut className="mr-2 h-6 w-6" /> Check Out
                    </Button>
                    <Button variant="outline" onClick={() => setShowExtend(true)} className="h-14 w-14 rounded-2xl border-2">
                      <Clock className="h-8 w-8" />
                    </Button>
                  </>
                )}
                {booking.dueAmount > 0 && (
                  <Button variant="destructive" className="w-full h-14 font-black text-xl rounded-2xl shadow-xl shadow-destructive/20 animate-bounce" onClick={() => setShowDueModal(true)}>
                    Pay & Exit
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={showCancelPreview} onOpenChange={setShowCancelPreview}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-0 overflow-hidden shadow-2xl">
          <div className="bg-destructive/5 p-10 border-b border-white/10">
            <DialogTitle className="text-4xl font-black tracking-tighter text-destructive">Cancel Booking</DialogTitle>
            <DialogDescription className="font-bold mt-1 opacity-60">Review your refund details before confirming.</DialogDescription>
          </div>
          <div className="p-10 space-y-8">
            {cancelPreviewData && (
              <div className="p-6 rounded-3xl bg-white/30 border-2 border-white/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Original Payment</span>
                  <span className="text-lg font-black">৳{cancelPreviewData.paidAmount}</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span className="text-xs font-black uppercase tracking-widest">Cancellation Fee ({cancelPreviewData.penaltyPercent}%)</span>
                  <span className="text-lg font-black">-৳{cancelPreviewData.penaltyAmount}</span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-primary/20 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-widest text-primary">Total Refund</span>
                  <span className="text-4xl font-black text-primary">৳{cancelPreviewData.refundAmount}</span>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black" onClick={() => setShowCancelPreview(false)}>Go Back</Button>
              <Button variant="destructive" className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-destructive/20" onClick={() => handleAction('cancel')} disabled={cancelBooking.isPending}>
                {cancelBooking.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDueModal} onOpenChange={setShowDueModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-0 overflow-hidden shadow-2xl">
          <div className="bg-destructive/5 p-10 border-b border-white/10">
            <DialogTitle className="text-4xl font-black tracking-tighter text-destructive uppercase">Overtime Payment</DialogTitle>
            <DialogDescription className="font-bold mt-1 opacity-60">Your session has exceeded the allocated time.</DialogDescription>
          </div>
          <div className="p-10 space-y-10">
            <div className="flex flex-col items-center justify-center p-12 bg-destructive/[0.03] rounded-[2.5rem] border-2 border-destructive/10 relative overflow-hidden">
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-destructive rounded-full" />
              <CreditCard className="h-20 w-20 text-destructive mb-4 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive relative z-10 opacity-60">Payable Amount</span>
              <span className="text-6xl font-black text-destructive relative z-10 mt-2">৳{Number(booking.dueAmount || 0).toFixed(2)}</span>
            </div>
            <Button className="w-full h-16 text-2xl font-black rounded-3xl shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 ripple" onClick={handlePayDue} disabled={isProcessingDue}>
              {isProcessingDue ? <Loader2 className="h-8 w-8 animate-spin" /> : "Settle Balance & Finish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserProfileForm({ userId, user }: { userId: string, user: any }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const updateProfile = useUpdateSmartTouristUserProfile();
  const { logout } = useAuth();
  
  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"warning" | "otp">("warning");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ userId, data: { name, email, phone, address, photoUrl: user.photoUrl, password } }, {
      onSuccess: () => {
        toast({ title: "Profile Secured", description: "Your changes have been locked in." });
        setPassword("");
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const requestDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/smart-tourist/user/${userId}/delete-request`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to request deletion");
      }
      setDeleteStep("otp");
      toast({ title: "Verification Sent", description: "Check your email for the deletion code." });
    } catch (err: any) {
      toast({ title: "Action Blocked", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/smart-tourist/user/${userId}/delete-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOtp })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid code");
      }
      toast({ title: "Account Deleted", description: "Your data has been deactivated. Redirecting..." });
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto rounded-[3rem] glass-card overflow-hidden shadow-2xl border-white/20">
      <CardHeader className="bg-primary/5 p-10 border-b border-white/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <User className="h-12 w-12 text-white" />
          </div>
          <div>
            <CardTitle className="text-4xl font-black tracking-tighter">Profile Console</CardTitle>
            <CardDescription className="font-bold text-primary opacity-60">Manage your personal data and security keys.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Full Identity</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg px-6" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Secure Mobile</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} required className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg px-6" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email Address</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg px-6" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Base Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} required className="h-14 rounded-2xl bg-white/50 dark:bg-black/20 border-white/40 font-black text-lg px-6" />
          </div>
          <div className="space-y-3 col-span-1 sm:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">New Security Key (Password)</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} placeholder="Leave empty to maintain existing key" className="h-16 rounded-2xl bg-primary/5 border-2 border-primary/20 font-black text-lg px-6" />
          </div>
          <Button type="submit" disabled={updateProfile.isPending} className="col-span-1 sm:col-span-2 h-16 rounded-3xl font-black text-2xl shadow-2xl shadow-primary/20 ripple">
            {updateProfile.isPending ? <Loader2 className="h-8 w-8 animate-spin" /> : "Commit Profile Updates"}
          </Button>
        </form>

        <div className="mt-16 pt-10 border-t border-destructive/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] bg-destructive/5 border border-destructive/10">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-black text-destructive uppercase tracking-tighter">Danger Zone</h4>
              <p className="text-xs font-bold text-muted-foreground">Permanently deactivate your account and erase active session access.</p>
            </div>
            <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
              setIsDeleteModalOpen(open);
              if (!open) {
                setDeleteStep("warning");
                setDeleteOtp("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-destructive/20">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-card p-10 border-white/20 shadow-2xl">
                <DialogHeader className="space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                    <Trash2 className="h-8 w-8 text-destructive" />
                  </div>
                  <DialogTitle className="text-3xl font-black text-center tracking-tighter uppercase">
                    {deleteStep === "warning" ? "Critical Action" : "Verify Identity"}
                  </DialogTitle>
                  <DialogDescription className="text-center font-bold text-muted-foreground">
                    {deleteStep === "warning" 
                      ? "Are you absolutely sure? This will deactivate your account and you will lose access to all active services. This cannot be undone." 
                      : "We've sent a 6-digit verification code to your email. Enter it below to confirm permanent deletion."}
                  </DialogDescription>
                </DialogHeader>

                {deleteStep === "otp" && (
                  <div className="space-y-4 py-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-destructive ml-2 text-center block w-full">Verification Code</Label>
                    <Input 
                      value={deleteOtp} 
                      onChange={e => setDeleteOtp(e.target.value)} 
                      placeholder="Enter 6-digit OTP" 
                      className="h-16 rounded-2xl text-center text-3xl font-black tracking-[0.5em] bg-destructive/5 border-destructive/20 focus-visible:ring-destructive/20" 
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-6">
                  {deleteStep === "warning" ? (
                    <Button 
                      onClick={requestDelete} 
                      disabled={isDeleting}
                      variant="destructive" 
                      className="h-16 rounded-2xl font-black text-lg uppercase tracking-widest"
                    >
                      {isDeleting ? <Loader2 className="h-6 w-6 animate-spin" /> : "I Understand, Send OTP"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={confirmDelete} 
                      disabled={isDeleting || deleteOtp.length < 4}
                      variant="destructive" 
                      className="h-16 rounded-2xl font-black text-lg uppercase tracking-widest"
                    >
                      {isDeleting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm Permanent Deletion"}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl font-bold">
                    Cancel & Keep Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// ReviewsInline — User submits & views their own reviews
// ─────────────────────────────────────────────────────────
type ReviewItem = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
};

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-all duration-150 ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-125"
          }`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsInline({ userId, userName }: { userId: string; userName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch reviews from backend
  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/smart-tourist/reviews");
      const data = await res.json();
      setAllReviews(data.reviews || []);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  // Real-time: invalidate on any review event
  useRealtime(() => { fetchReviews(); });

  const myReviews = allReviews.filter(r => r.userId === userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/smart-tourist/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rating, text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      setText("");
      setRating(5);
      await fetchReviews();
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">My Reviews</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Share your experience with the Smart Locker System.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-black text-amber-600">{myReviews.length} Review{myReviews.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Submit Form */}
      <Card className="glass-card rounded-[2.5rem] border-white/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 px-10 py-8 border-b border-white/10">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-primary" />
            </div>
            Leave a Review
          </CardTitle>
          <CardDescription className="font-medium">Rate your overall experience with Smart Locker System</CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Rating</Label>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/30">
                <StarRating value={rating} onChange={setRating} />
                <span className="text-sm font-black text-muted-foreground">
                  {["Terrible","Poor","Average","Good","Excellent"][rating-1]}
                </span>
              </div>
            </div>
            {/* Review Text */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Review</Label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={1000}
                rows={4}
                placeholder="Share your experience — what did you love, or what can we improve?"
                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{text.length}/1000</p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Star className="h-5 w-5 mr-2" />}
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Past Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> My Submitted Reviews
        </h3>
        {loadingReviews ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : myReviews.length === 0 ? (
          <Card className="glass-card rounded-[2rem] border-dashed">
            <CardContent className="p-12 text-center space-y-3">
              <Star className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground font-medium">You haven't submitted any reviews yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <Card key={review.id} className="glass-card rounded-[2rem] border-white/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <StarRating value={review.rating} readonly />
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{review.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}