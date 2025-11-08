import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Plus, Trash2 } from "lucide-react";

interface Destination {
  id: string;
  destination_name: string;
  location: string;
  description: string;
  category: string;
  notes: string;
  created_at: string;
}

const Discover = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('saved_destinations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error: any) {
      console.error('Error fetching destinations:', error);
      toast.error("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  const saveDestination = async () => {
    if (!name || !location) {
      toast.error("Please fill in name and location");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('saved_destinations').insert({
        user_id: user.id,
        destination_name: name,
        location,
        description,
        category,
        notes: ""
      });

      if (error) throw error;
      toast.success("Destination saved!");
      setDialogOpen(false);
      setName("");
      setLocation("");
      setDescription("");
      setCategory("");
      fetchDestinations();
    } catch (error: any) {
      console.error('Error saving destination:', error);
      toast.error(error.message || "Failed to save destination");
    }
  };

  const deleteDestination = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_destinations').delete().eq('id', id);
      if (error) throw error;
      toast.success("Destination removed");
      setDestinations(destinations.filter(dest => dest.id !== id));
    } catch (error: any) {
      console.error('Error deleting destination:', error);
      toast.error("Failed to remove destination");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading destinations...</p>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Save Destination
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save a Destination</DialogTitle>
                <DialogDescription>Add a place you want to visit</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Destination Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Hidden temple"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kyoto, Japan"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Culture, Nature, Food..."
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why you want to visit..."
                  />
                </div>
                <Button onClick={saveDestination} className="w-full">Save Destination</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Discover & Save</h1>
        <p className="text-muted-foreground mb-8">Your bucket list of places to explore</p>

        {destinations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No saved destinations</h3>
              <p className="text-muted-foreground mb-4">Start building your travel bucket list!</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Save a Destination
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <Card key={dest.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{dest.destination_name}</CardTitle>
                      <CardDescription>{dest.location}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDestination(dest.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dest.category && (
                    <p className="text-xs text-muted-foreground mb-2">{dest.category}</p>
                  )}
                  {dest.description && (
                    <p className="text-sm">{dest.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Discover;
