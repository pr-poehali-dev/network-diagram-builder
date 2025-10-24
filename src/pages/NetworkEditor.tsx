import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface NetworkDevice {
  id: string;
  type: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

interface DeviceTemplate {
  type: string;
  name: string;
  icon: string;
}

const deviceTemplates: DeviceTemplate[] = [
  { type: 'router', name: 'Роутер', icon: 'Router' },
  { type: 'switch', name: 'Коммутатор', icon: 'Network' },
  { type: 'server', name: 'Сервер', icon: 'Server' },
  { type: 'pc', name: 'ПК', icon: 'Monitor' },
  { type: 'laptop', name: 'Ноутбук', icon: 'Laptop' },
  { type: 'phone', name: 'Телефон', icon: 'Smartphone' },
  { type: 'cloud', name: 'Облако', icon: 'Cloud' },
  { type: 'database', name: 'База данных', icon: 'Database' },
];

export default function NetworkEditor() {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDeviceAdd = (template: DeviceTemplate) => {
    const newDevice: NetworkDevice = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      name: `${template.name} ${devices.filter(d => d.type === template.type).length + 1}`,
      icon: template.icon,
      x: 100,
      y: 100,
    };
    setDevices([...devices, newDevice]);
  };

  const handleDeviceMouseDown = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    setSelectedDevice(deviceId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - device.x - panOffset.x,
      y: e.clientY - device.y - panOffset.y,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDragging) {
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      setSelectedDevice(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedDevice) {
      setDevices(devices.map(d =>
        d.id === selectedDevice
          ? {
              ...d,
              x: e.clientX - dragOffset.x - panOffset.x,
              y: e.clientY - dragOffset.y - panOffset.y,
            }
          : d
      ));
    } else if (isPanning) {
      const deltaX = e.clientX - lastPanPosition.x;
      const deltaY = e.clientY - lastPanPosition.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleDeviceDelete = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
    setSelectedDevice(null);
  };

  const handleExportJSON = () => {
    const exportData = {
      version: '1.0',
      devices: devices,
      panOffset: panOffset,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-diagram-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#F6F6F7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="Network" size={24} className="text-[#0EA5E9]" />
          <h1 className="text-xl font-semibold text-[#1A1F2C]">Конструктор сетевой топологии</h1>
        </div>
        <Button onClick={handleExportJSON} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
          <Icon name="Download" size={18} className="mr-2" />
          Экспорт JSON
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Card className="w-64 m-4 p-4 bg-white shadow-sm">
          <h2 className="font-semibold text-[#1A1F2C] mb-4 flex items-center gap-2">
            <Icon name="Library" size={18} />
            Библиотека устройств
          </h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {deviceTemplates.map((template) => (
                <Button
                  key={template.type}
                  variant="outline"
                  className="w-full justify-start hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9] transition-all"
                  onClick={() => handleDeviceAdd(template)}
                >
                  <Icon name={template.icon} size={20} className="mr-2 text-[#0EA5E9]" />
                  {template.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <div className="flex-1 m-4 relative">
          <div
            ref={canvasRef}
            className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden cursor-move relative"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              backgroundImage: `
                linear-gradient(to right, #E5E7EB 1px, transparent 1px),
                linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          >
            {devices.map((device) => (
              <div
                key={device.id}
                className={`absolute bg-white rounded-lg shadow-md p-4 cursor-move transition-all hover:shadow-lg ${
                  selectedDevice === device.id ? 'ring-2 ring-[#0EA5E9] shadow-xl scale-105' : ''
                }`}
                style={{
                  left: device.x + panOffset.x,
                  top: device.y + panOffset.y,
                  width: '120px',
                }}
                onMouseDown={(e) => handleDeviceMouseDown(e, device.id)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-[#0EA5E9]/10 rounded-lg flex items-center justify-center">
                    <Icon name={device.icon} size={28} className="text-[#0EA5E9]" />
                  </div>
                  <span className="text-sm font-medium text-[#1A1F2C] text-center">{device.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-80 m-4 p-4 bg-white shadow-sm">
          <h2 className="font-semibold text-[#1A1F2C] mb-4 flex items-center gap-2">
            <Icon name="List" size={18} />
            Размещённые объекты ({devices.length})
          </h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {devices.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет объектов на схеме</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-[#0EA5E9] ${
                      selectedDevice === device.id
                        ? 'bg-[#0EA5E9]/5 border-[#0EA5E9]'
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => setSelectedDevice(device.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name={device.icon} size={20} className="text-[#0EA5E9]" />
                        <div>
                          <p className="text-sm font-medium text-[#1A1F2C]">{device.name}</p>
                          <p className="text-xs text-gray-500">
                            x: {Math.round(device.x)}, y: {Math.round(device.y)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeviceDelete(device.id);
                        }}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
