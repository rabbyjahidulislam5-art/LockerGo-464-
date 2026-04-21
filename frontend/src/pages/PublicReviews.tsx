import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, MessageSquare, ArrowLeft } from "lucide-react";
import { useRealtime, formatDateTime } from "@/lib/utils";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type ReviewItem = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
};

function PublicStarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function PublicReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/smart-tourist/reviews?limit=100");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error("Failed to fetch public reviews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);
  useRealtime(() => { fetchReviews(); });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative pt-32 pb-20 px-4 overflow-hidden bg-primary/5">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48"
          />
        </div>

        <div className="container mx-auto relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Button 
              variant="ghost" 
              className="mb-8 rounded-full hover:bg-primary/10 group"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Traveler Community</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
              Traveler <span className="text-primary">Reviews</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-medium">
              See what hundreds of travelers across Bangladesh are saying about their Smart Locker experience.
            </p>
          </motion.div>

          {reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 pt-4"
            >
              <div className="flex items-center gap-2 px-8 py-4 rounded-3xl glass-card border-white/30 shadow-2xl">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                <span className="font-black text-3xl">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Average Rating</p>
                  <p className="text-xs font-bold text-primary">Based on {reviews.length} reviews</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-10 relative z-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Quote className="h-10 w-10 text-primary opacity-20" />
            </motion.div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full glass-card rounded-[2.5rem] border-white/20 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                    <CardContent className="p-10 flex flex-col gap-6 h-full">
                      <Quote className="h-10 w-10 text-primary/10 group-hover:text-primary/30 transition-colors" />
                      
                      <p className="text-base text-foreground/80 leading-relaxed flex-1 italic">
                        "{review.text}"
                      </p>

                      <div className="pt-6 border-t border-white/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-xs font-black text-primary">
                              {review.userName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-black text-sm">{review.userName}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                              {formatDateTime(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <PublicStarRating value={review.rating} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32 glass-card rounded-[4rem] border-dashed border-primary/20">
            <MessageSquare className="h-16 w-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-2xl font-black">No reviews shared yet</h2>
            <p className="text-muted-foreground mt-2">Become our next happy traveler and share your story!</p>
          </div>
        )}
      </div>
    </div>
  );
}
