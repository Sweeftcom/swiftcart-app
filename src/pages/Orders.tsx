import { motion } from 'framer-motion';
import { ArrowLeft, Package, ChevronRight, Star, Clock, MapPin, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

const mockOrders = [
  {
    id: 'ORD-001',
    orderNumber: '#BLK12345',
    status: 'delivered',
    statusLabel: 'Delivered',
    items: [
      { name: 'Amul Taaza Milk', quantity: 2 },
      { name: 'Britannia Bread', quantity: 1 },
      { name: 'Eggs (6 pcs)', quantity: 1 },
    ],
    total: 185,
    date: '5 Jan, 2026',
    time: '10:30 AM',
    deliveredIn: '12 mins',
    rating: null,
  },
  {
    id: 'ORD-002',
    orderNumber: '#BLK12344',
    status: 'delivered',
    statusLabel: 'Delivered',
    items: [
      { name: 'Maggi Noodles', quantity: 5 },
      { name: 'Coca-Cola 750ml', quantity: 2 },
    ],
    total: 150,
    date: '4 Jan, 2026',
    time: '8:15 PM',
    deliveredIn: '15 mins',
    rating: 5,
  },
  {
    id: 'ORD-003',
    orderNumber: '#BLK12343',
    status: 'out_for_delivery',
    statusLabel: 'Out for Delivery',
    items: [
      { name: 'Fresh Bananas', quantity: 1 },
      { name: 'Tomatoes 500g', quantity: 1 },
      { name: 'Onions 1kg', quantity: 1 },
    ],
    total: 120,
    date: 'Today',
    time: '2:45 PM',
    eta: '5 mins',
  },
];

const Orders = () => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'out_for_delivery':
        return 'bg-info/10 text-info';
      case 'packing':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-card">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">My Orders</h1>
        </div>
      </header>

      <main className="container py-4 space-y-4">
        {mockOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl overflow-hidden shadow-card"
          >
            {/* Order Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">{order.orderNumber}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{order.date} at {order.time}</span>
                {order.deliveredIn && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">Delivered in {order.deliveredIn}</span>
                  </>
                )}
                {order.eta && (
                  <>
                    <span>•</span>
                    <span className="text-info font-medium">ETA: {order.eta}</span>
                  </>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">₹{order.total}</span>
                
                {order.status === 'delivered' && !order.rating && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/20 text-accent-foreground text-sm font-medium"
                  >
                    <Star className="w-4 h-4" />
                    Rate Order
                  </motion.button>
                )}

                {order.status === 'delivered' && order.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < order.rating! ? 'fill-accent text-accent' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {order.status === 'out_for_delivery' && (
                  <Link to={`/track/${order.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      Track Order
                    </motion.button>
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border">
              <div className="flex">
                <button className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-secondary transition-colors">
                  Reorder
                </button>
                <div className="w-px bg-border" />
                <button className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                  Help
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
