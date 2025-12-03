import { useState, useEffect } from 'react';
import { saveFinancials, getDashboardData } from '../services/api';

export const BreakEvenPage = () => {
    const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 7) + '-01'); // YYYY-MM-01
    const [payroll, setPayroll] = useState('');
    const [rent, setRent] = useState('');
    const [utilities, setUtilities] = useState('');
    const [otherFixedCosts, setOtherFixedCosts] = useState('');
    const [totalSales, setTotalSales] = useState('');
    const [avgMargin, setAvgMargin] = useState(0);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch average margin to display potential BEP
        const fetchMargin = async () => {
            try {
                const res = await getDashboardData();
                setAvgMargin(res.data.avgMargin);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMargin();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveFinancials({
                periodDate,
                payroll: parseFloat(payroll) || 0,
                rent: parseFloat(rent) || 0,
                utilities: parseFloat(utilities) || 0,
                otherFixedCosts: parseFloat(otherFixedCosts) || 0,
                totalSales: parseFloat(totalSales) || 0
            });
            setMessage('Datos guardados correctamente.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving financials:', error);
            setMessage('Error al guardar los datos.');
        }
    };

    const totalFixedCosts = (parseFloat(payroll) || 0) + (parseFloat(rent) || 0) + (parseFloat(utilities) || 0) + (parseFloat(otherFixedCosts) || 0);
    const calculatedBEP = avgMargin > 0 ? totalFixedCosts / (avgMargin / 100) : 0;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Calculadora de Punto de Equilibrio</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Registro Mensual</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mes</label>
                            <input
                                type="date"
                                value={periodDate}
                                onChange={(e) => setPeriodDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nómina</label>
                                <input
                                    type="number"
                                    value={payroll}
                                    onChange={(e) => setPayroll(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Renta</label>
                                <input
                                    type="number"
                                    value={rent}
                                    onChange={(e) => setRent(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Servicios (Luz, Agua, Gas)</label>
                                <input
                                    type="number"
                                    value={utilities}
                                    onChange={(e) => setUtilities(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Otros Gastos Fijos</label>
                                <input
                                    type="number"
                                    value={otherFixedCosts}
                                    onChange={(e) => setOtherFixedCosts(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700">Ventas Totales del Mes</label>
                            <input
                                type="number"
                                value={totalSales}
                                onChange={(e) => setTotalSales(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                placeholder="0.00"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Guardar Registro
                        </button>
                        {message && <p className={`text-center text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                    </form>
                </div>

                {/* Calculation Result Section */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Análisis</h2>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm text-gray-500">Gastos Fijos Totales</p>
                            <p className="text-2xl font-bold text-gray-800">${totalFixedCosts.toLocaleString()}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Margen Promedio (de Recetas)</p>
                            <p className="text-2xl font-bold text-green-600">{avgMargin.toFixed(2)}%</p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-500">Punto de Equilibrio Estimado</p>
                            <p className="text-3xl font-bold text-blue-600">${calculatedBEP.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-400 mt-1">Necesitas vender esta cantidad para cubrir tus gastos fijos.</p>
                        </div>

                        {parseFloat(totalSales) > 0 && (
                            <div className={`p-4 rounded-md ${parseFloat(totalSales) >= calculatedBEP ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <p className="font-bold">{parseFloat(totalSales) >= calculatedBEP ? '¡Punto de Equilibrio Alcanzado!' : 'Aún no alcanzas el punto de equilibrio'}</p>
                                <p className="text-sm">
                                    {parseFloat(totalSales) >= calculatedBEP
                                        ? `Superávit: $${(parseFloat(totalSales) - calculatedBEP).toLocaleString()}`
                                        : `Faltante: $${(calculatedBEP - parseFloat(totalSales)).toLocaleString()}`
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


