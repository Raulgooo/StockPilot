import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, Save } from "lucide-react";
import { getSimulationSettings, updateSimulationSettings } from "@/components/services/supplier";
import { useToast } from "@/hooks/use-toast";

interface SimulationSettingsProps {
  onBack: () => void;
}

interface SettingsData {
  delivery_time_multiplier: number;
  auto_place_orders: boolean;
}

export const SimulationSettings = ({ onBack }: SimulationSettingsProps) => {
  const [settings, setSettings] = useState<SettingsData>({
    delivery_time_multiplier: 1.0,
    auto_place_orders: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getSimulationSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast({
          title: "Error",
          description: "Failed to load simulation settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSimulationSettings(settings);
      toast({
        title: "Success",
        description: "Simulation settings updated successfully",
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast({
        title: "Error",
        description: "Failed to save simulation settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Simulation Settings</h1>
              <p className="text-muted-foreground">Configure simulation parameters</p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Delivery & Timing Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="delivery_multiplier">Delivery Time Multiplier</Label>
                <Input
                  id="delivery_multiplier"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={settings.delivery_time_multiplier}
                  onChange={(e) => setSettings({
                    ...settings,
                    delivery_time_multiplier: parseFloat(e.target.value) || 1.0
                  })}
                  placeholder="1.0"
                />
                <p className="text-sm text-muted-foreground">
                  Multiplier for supplier delivery times (1.0 = normal speed)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto_place">Auto-place Orders</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_place"
                    checked={settings.auto_place_orders}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      auto_place_orders: checked
                    })}
                  />
                  <Label htmlFor="auto_place">
                    {settings.auto_place_orders ? "Enabled" : "Disabled"}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically place orders in inventory when received
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
