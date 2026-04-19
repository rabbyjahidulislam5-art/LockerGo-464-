import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useConfirmSmartTouristBookingOtp,
  useGetSmartTouristBootstrap,
  useRequestSmartTouristBookingOtp,
  Station,
  Locker,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Search, Star, Quote, MessageSquare } from "lucide-react";
import { useRealtime } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { data: bootstrapData, isLoading } = useGetSmartTouristBootstrap();
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { role } = useAuth();
  const [, setLocation] = useLocation();
  const [bookingStation, setBookingStation] = useState<Station | null>(null);

  const filteredStations = useMemo(() => {
    if (!bootstrapData) return [];
    return (bootstrapData?.stations ?? []).filter((station: any) => {
      const matchesDest = selectedDestination === "all" || station.destinationId === selectedDestination;
      const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            station.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDest && matchesSearch;
    });
  }, [bootstrapData, selectedDestination, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!bootstrapData) {
    return <div className="p-8 text-center text-destructive font-bold">Failed to load system data. Please try again.</div>;
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"
          />
        </div>

        <div className="container mx-auto relative z-10 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5 backdrop-blur-md rounded-full font-bold tracking-wider uppercase text-[10px]">
              Secure & Smart Travel Experience
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
              Luggage Freedom <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Across Bangladesh</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-medium">
              Secure your belongings in our network of smart lockers located at major tourist spots and transit hubs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {role === "user" ? (
              <Button onClick={() => setLocation("/user")} size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                My Dashboard
              </Button>
            ) : (
              <Button onClick={() => window.dispatchEvent(new CustomEvent("smart-tourist-open-register"))} size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Get Started Now
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold border-white/20 bg-white/50 dark:bg-black/20 backdrop-blur-md hover:bg-white/80 transition-colors" onClick={() => {
              const el = document.getElementById('locker-search');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Find Lockers
            </Button>
          </motion.div>
        </div>
      </div>

      <div id="locker-search" className="container mx-auto px-4 md:px-8 space-y-12">
        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 items-end"
        >
          <div className="flex-1 space-y-2 w-full">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Location Search</Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Where are you exploring?"
                className="pl-12 h-14 bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 rounded-2xl focus-visible:ring-primary/20 text-lg"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-[280px] space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Destination</Label>
            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
              <SelectTrigger className="h-14 bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 rounded-2xl focus:ring-primary/20 text-lg">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl">
                <SelectItem value="all">All Destinations</SelectItem>
                {(bootstrapData?.destinations ?? []).map((dest: any) => (
                  <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Station Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredStations.map((station: any) => (
              <StationCard
                key={station.id}
                station={station}
                lockers={bootstrapData.lockers.filter((locker: any) => locker.stationId === station.id)}
                destinationName={bootstrapData.destinations.find((d: any) => d.id === station.destinationId)?.name || ""}
                onBook={() => setBookingStation(station)}
              />
            ))}
          </AnimatePresence>
          {filteredStations.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="inline-block p-6 rounded-full bg-muted/20 mb-4">
                <Search className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold">No Stations Found</h3>
              <p className="text-muted-foreground">Try adjusting your search or destination filters.</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <LockerBookingModal
        station={bookingStation}
        lockers={bookingStation ? bootstrapData.lockers.filter((locker: any) => locker.stationId === bookingStation.id) : []}
        open={!!bookingStation}
        onOpenChange={(open) => !open && setBookingStation(null)}
      />


    </div>
  );
}

function StationCard({ station, lockers, destinationName, onBook }: { station: Station, lockers: Locker[], destinationName: string, onBook: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="h-full flex flex-col overflow-hidden border-white/20 dark:border-white/10 glass-card rounded-[2rem] transition-all group hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative h-48 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 mix-blend-overlay" />
          <img 
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${station.name}&backgroundColor=6366f1,3b82f6`} 
            alt={station.name}
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 right-4">
            <Badge className={`px-3 py-1 rounded-full font-bold shadow-lg ${station.availableLockers > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {station.availableLockers} Available
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <Badge variant="secondary" className="backdrop-blur-md bg-white/20 text-white border-white/20 font-bold px-3 py-1">
              <MapPin className="h-3 w-3 mr-1" />
              {destinationName}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{station.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {station.address}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border border-white/40 dark:border-white/10 rounded-2xl p-4 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-xl font-black text-primary">{station.totalLockers}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Units</div>
            </div>
            <div className="text-center border-x border-white/40 dark:border-white/10">
              <div className="text-xl font-black text-orange-500">{station.bookedLockers}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reserved</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-blue-500">{station.processingLockers}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active</div>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-primary/20 ripple" 
            onClick={onBook}
            disabled={station.availableLockers === 0}
          >
            {station.availableLockers === 0 ? "Station Full" : "Instant Booking"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LockerBookingModal({ station, lockers, open, onOpenChange }: { station: Station | null, lockers: Locker[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { userId, setAuth } = useAuth();
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [durationHours, setDurationHours] = useState("4");
  const [checkInTime, setCheckInTime] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [otpId, setOtpId] = useState("");
  const [otp, setOtp] = useState("");
  const requestOtp = useRequestSmartTouristBookingOtp();
  const confirmOtp = useConfirmSmartTouristBookingOtp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const duration = Math.max(1, parseInt(durationHours) || 1);
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkIn.getTime() + duration * 60 * 60 * 1000);
  const totalCost = duration * 50;

  const reset = () => {
    setSelectedLocker(null);
    setShowForm(false);
    setDurationHours("4");
    setCheckInTime(new Date().toISOString().slice(0, 16));
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
      data: {
        userId,
        stationId: station.id,
        lockerId: selectedLocker.id,
        durationHours: duration,
        checkInTime: checkIn.toISOString(),
      }
    }, {
      onSuccess: (data: any) => {
        setOtpId(data.otpId);
        toast({ title: "OTP Sent Successfully", description: "Please check your registered email for the code." });
      },
      onError: (err: any) => {
        const msg = err.message || "";
        const cleanMsg = msg.includes(":") ? msg.split(":").pop()?.trim() : msg;
        toast({ title: "Booking Request Failed", description: cleanMsg || "Unable to process booking. Please try again.", variant: "destructive" });
      }
    });
  };

  const handleConfirmOtp = (e: React.FormEvent) => {
    e.preventDefault();
    confirmOtp.mutate({ data: { otpId, otp } }, {
      onSuccess: () => {
        toast({ title: "Booking Confirmed!", description: "Redirecting to your dashboard..." });
        queryClient.invalidateQueries({ queryKey: ['/api/smart-tourist/bootstrap'] });
        handleOpenChange(false);
        setLocation("/user");
      },
      onError: (err: any) => {
        const msg = err.message || "";
        const cleanMsg = msg.includes(":") ? msg.split(":").pop()?.trim() : msg;
        toast({ title: "Verification Failed", description: cleanMsg || "The OTP code is incorrect. Please check your email.", variant: "destructive" });
      }
    });
  };

  const lockerColor = (locker: Locker) => {
    if (locker.status === "available") return "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500 hover:text-white";
    if (locker.status === "occupied" || locker.status === "processing") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 cursor-not-allowed";
    return "bg-red-500/10 text-red-600 border-red-500/30 cursor-not-allowed";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[92vh] rounded-[2.5rem] border-white/20 glass-card p-0 overflow-hidden flex flex-col">
          <div className="bg-primary/5 px-8 py-5 border-b border-white/10 flex-shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tighter">Choose Your Locker</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-sm">Select an available green unit to start your booking at {station?.name}.</DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
            {station && (
              <div className="grid grid-cols-10 gap-1.5">
                {lockers.map(locker => (
                  <motion.button
                    key={locker.id}
                    whileHover={locker.status === "available" ? { scale: 1.12 } : {}}
                    whileTap={locker.status === "available" ? { scale: 0.95 } : {}}
                    type="button"
                    disabled={locker.status !== "available"}
                    onClick={() => {
                      if (!userId) {
                        window.dispatchEvent(new CustomEvent("smart-tourist-open-login"));
                        return;
                      }
                      setSelectedLocker(locker);
                      setShowForm(true);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black border-2 transition-all duration-200 ${lockerColor(locker)} ${selectedLocker?.id === locker.id ? "ring-4 ring-primary ring-offset-2" : ""}`}
                  >
                    {locker.number}
                  </motion.button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-4 justify-center p-3 rounded-2xl bg-white/30 dark:bg-black/20 border border-white/20 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" /> Available</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" /> Reserved</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" /> In Use</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(nextOpen) => { setShowForm(nextOpen); if (!nextOpen && !otpId) setSelectedLocker(null); }}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-white/20 glass-card p-0 overflow-hidden">
          <div className="bg-primary/5 p-8 border-b border-white/10">
            <DialogTitle className="text-3xl font-black tracking-tighter">Finalize Booking</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">Locker #{selectedLocker?.number} at {station?.name}</DialogDescription>
          </div>
          <div className="p-8">
            {selectedLocker && station && (
              <form onSubmit={otpId ? handleConfirmOtp : handleRequestOtp} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Duration (Hours)</Label>
                    <Input type="number" min="1" max="24" value={durationHours} onChange={e => setDurationHours(e.target.value)} disabled={!!otpId} className="h-12 rounded-xl bg-white/50 dark:bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Total Payable</Label>
                    <div className="h-12 flex items-center px-4 rounded-xl bg-primary/10 border border-primary/20 text-xl font-black text-primary">৳{totalCost}</div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Arrival Time</Label>
                    <Input type="datetime-local" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} disabled={!!otpId} className="h-12 rounded-xl bg-white/50 dark:bg-black/20" />
                  </div>
                </div>

                <AnimatePresence>
                  {otpId && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <Label className="text-xs font-bold uppercase tracking-widest text-primary ml-1">Verification OTP</Label>
                      <Input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="000000" required className="h-16 rounded-xl text-center tracking-[1rem] text-3xl font-black bg-primary/5 border-primary/30" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 pt-4">
                  {!otpId && <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowForm(false)}>Back</Button>}
                  <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" disabled={requestOtp.isPending || confirmOtp.isPending}>
                    {(requestOtp.isPending || confirmOtp.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {otpId ? "Confirm & Pay Now" : "Request Booking OTP"}
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


