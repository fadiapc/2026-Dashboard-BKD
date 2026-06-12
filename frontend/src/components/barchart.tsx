import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Download } from 'lucide-react';

interface BarChartProps {
    data: any[];
}

export const BarChartComponent = ({ data }: BarChartProps) => {
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        const canvas = document.getElementById('myChart') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const labels = data.map((item: any) => item.initials);
        const bkdValues = data.map((item: any) => item.bkd);

        const pluginBackground: any = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart: any, args: any, options: any) => {
                const {ctx} = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = options.color || '#ffffff';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };

        chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BKD',
                    data: bkdValues,
                    backgroundColor: bkdValues.map((value: number) => value < 4 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(53, 162, 235, 0.5)'),
                    borderColor: bkdValues.map((value: number) => value < 4 ? 'rgba(255, 99, 132, 1)' : 'rgba(53, 162, 235, 1)'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    customCanvasBackgroundColor: {
                        color: 'white',
                    }
                } as any
            },
            plugins: [pluginBackground]
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data]);

    const handleExport = () => {
        const canvas = document.getElementById('myChart') as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'Grafik-Evaluasi-BKD.png';
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="flex justify-end mb-2 shrink-0">
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-[#4D44B5] hover:bg-[#3a338a] text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Download size={16} />
                    Export
                </button>
            </div>
            
            <div className="relative flex-1 w-full h-full min-h-0 pb-2">
                <canvas id="myChart"></canvas>
            </div>
        </div>
    );
};

export default BarChartComponent;