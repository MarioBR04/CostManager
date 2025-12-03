import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const DashboardPage = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getDashboardData();
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando Dashboard...</div>;
    if (!data) return <div className="p-8 text-center">No hay datos disponibles.</div>;

    const { currentMonth, fixedCosts, avgMargin, breakEvenPoint, totalSales, topProducts, history } = data;

    // Prepare data for the chart (Sales vs Break Even)
    const chartData = history.map((item: any) => {
        // Calculate BEP for historical data if not stored (using current margin as approximation or if stored use that)
        // For simplicity, let's assume we want to compare Sales vs Fixed Costs vs BEP
        // BEP = Fixed Costs / (Avg Margin / 100)
        // We'll use the current avg margin for historical BEP calculation if not available, 
        // or just plot Sales vs Fixed Costs.
        // The user asked for "compare with our defined break even point".

        const historicalFixed = parseFloat(item.fixed_costs);
        const historicalBEP = avgMargin > 0 ? historicalFixed / (avgMargin / 100) : 0;

        return {
            name: new Date(item.period_date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
            Ventas: parseFloat(item.total_sales),
            'Punto de Equilibrio': historicalBEP,
            'Gastos Fijos': historicalFixed
        };
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Financiero</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium">Ventas del Mes</h3>
                    <p className="text-2xl font-bold text-gray-800">${totalSales.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(currentMonth).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-medium">Gastos Fijos</h3>
                    <p className="text-2xl font-bold text-gray-800">${fixedCosts.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm font-medium">Punto de Equilibrio</h3>
                    <p className="text-2xl font-bold text-gray-800">${breakEvenPoint.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Necesario para cubrir gastos</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium">Margen Promedio</h3>
                    <p className="text-2xl font-bold text-gray-800">{avgMargin.toFixed(2)}%</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales vs Break Even Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Ventas vs Punto de Equilibrio</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="Ventas" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="Punto de Equilibrio" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="Gastos Fijos" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products Table */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Productos con Mayor Margen</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topProducts.map((product: any, index: number) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.sale_price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{parseFloat(product.profit_margin).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { DashboardPage };
