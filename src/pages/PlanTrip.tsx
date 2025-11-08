import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PlanTrip = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [travelType, setTravelType] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState("");

  const interestOptions = [
    "Adventure", "Culture", "Food", "Photography", "Nature", 
    "History", "Beaches", "Shopping", "Nightlife", "Wellness"
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleGetRecommendations = async () => {
    if (!destination || !budget || !travelType || selectedInterests.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('travel-recommendations', {
        body: { 
          destination, 
          budget: parseFloat(budget), 
          travelType, 
          interests: selectedInterests,
          days 
        }
      });

      if (error) throw error;
      setAiRecommendations(data.recommendations);
      toast.success("AI recommendations generated!");
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      toast.error(error.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!destination || !startDate || !endDate || !budget) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: parseFloat(budget),
        travel_type: travelType,
        notes: aiRecommendations,
        status: 'planned'
      });

      if (error) throw error;
      toast.success("Trip saved successfully!");
      navigate('/trips');
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast.error(error.message || "Failed to save trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/20">
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Plan Your Trip</h1>
        <p className="text-muted-foreground mb-8">Get AI-powered recommendations for your perfect journey</p>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>Tell us about your travel plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Tokyo, Japan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="1000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="travel-type">Travel Type</Label>
                  <Select value={travelType} onValueChange={setTravelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interestOptions.map(interest => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGetRecommendations} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Recommendations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {aiRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Your Personalized Itinerary</CardTitle>
                <CardDescription>AI-generated recommendations for your trip</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={aiRecommendations}
                  onChange={(e) => setAiRecommendations(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <Button 
                  onClick={handleSaveTrip} 
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? "Saving..." : "Save Trip"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PlanTrip;
