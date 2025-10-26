import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Truck, 
  CheckCircle, 
  Clock, 
  QrCode,
  Trash2,
  ShoppingCart
} from "lucide-react";
import { 
  getSupplierProducts, 
  createOrder, 
  getOrders, 
  receiveOrder, 
  placeOrder, 
  deleteOrder 
} from "@/components/services/supplier";
import { useToast } from "@/hooks/use-toast";

interface OrdersViewProps {
  onBack: () => void;
}

interface SupplierProduct {
  product_name: string;
  weight_kg: number;
  price_per_unit: number;
  delivery_time_days: number;
  min_order_quantity: number;
  description: string;
}

interface Order {
  order_id: string;
  product_name: string;
  quantity: number;
  status: string;
  order_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  lot_id?: string;
  qr_code?: string;
}

export const OrdersView = ({ onBack }: OrdersViewProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    productName: '',
    quantity: 50
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, productsData] = await Promise.all([
          getOrders(),
          getSupplierProducts()
        ]);
        setOrders(ordersData);
        setSupplierProducts(productsData);
      } catch (err) {
        console.error('Failed to load data:', err);
        toast({
          title: "Error",
          description: "Failed to load orders and products",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleCreateOrder = async () => {
    if (!newOrder.productName || newOrder.quantity < 50) {
      toast({
        title: "Error",
        description: "Please select a product and ensure quantity is at least 50",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOrder(newOrder.productName, newOrder.quantity);
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      setNewOrder({ productName: '', quantity: 50 });
      setShowCreateDialog(false);
      
      // Reload orders
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to create order:', err);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const handleReceiveOrder = async (orderId: string) => {
    try {
      await receiveOrder(orderId);
      toast({
        title: "Success",
        description: "Order marked as received",
      });
      
      // Reload orders
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to receive order:', err);
      toast({
        title: "Error",
        description: "Failed to receive order",
        variant: "destructive",
      });
    }
  };

  const handlePlaceOrder = async (orderId: string) => {
    try {
      await placeOrder(orderId);
      toast({
        title: "Success",
        description: "Order placed in inventory",
      });
      
      // Reload orders
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to place order:', err);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      
      // Reload orders
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_delivery':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Truck className="h-3 w-3 mr-1" />In Delivery</Badge>;
      case 'received':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>;
      case 'available':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Package className="h-3 w-3 mr-1" />Available</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Supplier Orders</h1>
              <p className="text-muted-foreground">Manage supplier orders and inventory</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={newOrder.productName} onValueChange={(value) => setNewOrder({ ...newOrder, productName: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierProducts.map((product) => (
                        <SelectItem key={product.product_name} value={product.product_name}>
                          {product.product_name} - ${product.price_per_unit}/unit
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity (must be multiple of 50)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="50"
                    step="50"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateOrder} className="flex-1">
                    Create Order
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Orders Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Lot ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                  <TableCell className="font-medium">{order.product_name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{formatDate(order.expected_delivery)}</TableCell>
                  <TableCell>
                    {order.lot_id ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{order.lot_id}</span>
                        {order.qr_code && <QrCode className="h-4 w-4 text-green-600" />}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === 'in_delivery' && (
                        <Button
                          size="sm"
                          onClick={() => handleReceiveOrder(order.order_id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Receive
                        </Button>
                      )}
                      {order.status === 'received' && (
                        <Button
                          size="sm"
                          onClick={() => handlePlaceOrder(order.order_id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Place
                        </Button>
                      )}
                      {order.status === 'available' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteOrder(order.order_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};
