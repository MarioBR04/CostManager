import React from 'react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
    return (
        <div className="container">
            <div>
                <h1>Bienvenido a CostManager</h1>
                <p>Gestiona tus costos y recetas de manera eficiente.</p>
            </div>
            <div className="grid-2">
                <Link to="/ingredients">
                    <div className="card">
                        <div>
                            <h2>Insumos</h2>
                            <span>🥦</span>
                        </div>
                        <p>Administra tu lista de ingredientes, actualiza precios y proveedores para mantener tus costos al día.</p>
                    </div>
                </Link>
                <Link to="/recipes">
                    <div className="card">
                        <div>
                            <h2>Recetas</h2>
                            <span>📝</span>
                        </div>
                        <p>Crea recetas, calcula el Food Cost automáticamente y analiza tus márgenes de ganancia.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};
