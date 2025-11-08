import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Calendar, DollarSign, MapPin, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travel_type: string;
  status: string;
  notes: string;
}

const Trips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      toast.success("Trip deleted");
      setTrips(trips.filter(trip => trip.id !== id));
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      toast.error("Failed to delete trip");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading trips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/20">
      <header className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => navigate('/')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button onClick={() => navigate('/plan-trip')}>
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">My Trips</h1>
        <p className="text-muted-foreground mb-8">View and manage your travel adventures</p>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-4">Start planning your first adventure!</p>
              <Button onClick={() => navigate('/plan-trip')}>
                <Plus className="h-4 w-4 mr-2" />
                Plan a Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{trip.destination}</CardTitle>
                      <CardDescription className="capitalize">{trip.travel_type} trip</CardDescription>
                    </div>
                    <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>
                      {trip.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>${trip.budget.toLocaleString()} budget</span>
                  </div>
                  {trip.notes && (
                    <div className="bg-accent/50 p-3 rounded-md">
                      <p className="text-sm line-clamp-3">{trip.notes}</p>
                    </div>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => deleteTrip(trip.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Trip
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Trips;
