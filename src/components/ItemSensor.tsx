
interface ItemSensorProps {
    name: string;
    value: number | string;
    unit?: string;
    icon?: React.ReactNode;
}

export default function ItemSensor({ name, value, unit, icon }: ItemSensorProps) {
    return (
        <div className="flex items-center gap-2 p-4 bg-gray-800 rounded-lg shadow-md">
            {icon && <div className="text-2xl text-white">{icon}</div>}
            <div className="flex flex-col">
                <span className="text-sm text-gray-400">{name}</span>
                <span className="text-lg font-semibold text-white">
                    {value} {unit}
                </span>
            </div>
        </div>
    );
}