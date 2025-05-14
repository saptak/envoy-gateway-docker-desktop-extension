import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchGateways, createGateway, deleteGateway } from '../../../store/slices/gatewaySlice';
import { Card, Button, LoadingSpinner, Modal, Table } from '../../common';
import type { Gateway } from '../../../types';

interface GatewayFormData {
  name: string;
  namespace: string;
  gatewayClassName: string;
  listeners: Array<{
    name: string;
    port: number;
    protocol: string;
    hostname?: string;
  }>;
}

const Gateways: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { gateways, loading, error } = useSelector((state: RootState) => state.gateway);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<GatewayFormData>({
    name: '',
    namespace: 'default',
    gatewayClassName: 'envoy-gateway',
    listeners: [{
      name: 'http',
      port: 80,
      protocol: 'HTTP'
    }]
  });

  useEffect(() => {
    dispatch(fetchGateways());
  }, [dispatch]);

  const handleCreate = async () => {
    await dispatch(createGateway(formData));
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleDelete = async (name: string, namespace: string) => {
    if (window.confirm(`Are you sure you want to delete gateway ${name}?`)) {
      await dispatch(deleteGateway({ name, namespace }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      namespace: 'default',
      gatewayClassName: 'envoy-gateway',
      listeners: [{
        name: 'http',
        port: 80,
        protocol: 'HTTP'
      }]
    });
  };

  const addListener = () => {
    setFormData(prev => ({
      ...prev,
      listeners: [...prev.listeners, {
        name: '',
        port: 443,
        protocol: 'HTTPS'
      }]
    }));
  };

  const updateListener = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      listeners: prev.listeners.map((listener, i) => 
        i === index ? { ...listener, [field]: value } : listener
      )
    }));
  };

  const removeListener = (index: number) => {
    setFormData(prev => ({
      ...prev,
      listeners: prev.listeners.filter((_, i) => i !== index)
    }));
  };

  const gatewayColumns = [
    { key: 'name', label: 'Name' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'gatewayClassName', label: 'Gateway Class' },
    { key: 'status', label: 'Status' },
    { key: 'listeners', label: 'Listeners' },
    { key: 'actions', label: 'Actions' }
  ];

  const gatewayRows = gateways.map(gateway => ({
    name: gateway.metadata.name,
    namespace: gateway.metadata.namespace,
    gatewayClassName: gateway.spec.gatewayClassName,
    status: gateway.status?.conditions?.[0]?.type || 'Unknown',
    listeners: gateway.spec.listeners.length,
    actions: (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Navigate to gateway details
            console.log('View gateway details:', gateway.metadata.name);
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(gateway.metadata.name, gateway.metadata.namespace)}
        >
          Delete
        </Button>
      </div>
    )
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gateways</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Gateway
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card>
        <Table
          columns={gatewayColumns}
          data={gatewayRows}
          emptyMessage="No gateways found. Create your first gateway to get started."
        />
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Gateway"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-gateway"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Namespace</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.namespace}
              onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
              placeholder="default"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gateway Class</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.gatewayClassName}
              onChange={(e) => setFormData(prev => ({ ...prev, gatewayClassName: e.target.value }))}
            >
              <option value="envoy-gateway">envoy-gateway</option>
              <option value="custom-gateway">custom-gateway</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Listeners</label>
              <Button variant="outline" size="sm" onClick={addListener}>
                Add Listener
              </Button>
            </div>
            
            {formData.listeners.map((listener, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-3 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Listener {index + 1}</span>
                  {formData.listeners.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeListener(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={listener.name}
                      onChange={(e) => updateListener(index, 'name', e.target.value)}
                      placeholder="http"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Port</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={listener.port}
                      onChange={(e) => updateListener(index, 'port', parseInt(e.target.value))}
                      min="1"
                      max="65535"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Protocol</label>
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={listener.protocol}
                      onChange={(e) => updateListener(index, 'protocol', e.target.value)}
                    >
                      <option value="HTTP">HTTP</option>
                      <option value="HTTPS">HTTPS</option>
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hostname (optional)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={listener.hostname || ''}
                      onChange={(e) => updateListener(index, 'hostname', e.target.value)}
                      placeholder="example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || formData.listeners.length === 0}
            >
              Create Gateway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Gateways;