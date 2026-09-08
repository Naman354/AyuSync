import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBaseServerUrl } from '../lib/api';

export function useRealtimeQueue(doctorId: string) {
  const [queue, setQueue] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketServerUrl = getBaseServerUrl();

    // Connect to backend Socket.IO at root host with auto-reconnection
    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: {
        token: localStorage.getItem('ayusync_token')
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join doctor's specific room
      newSocket.emit('join:doctor', doctorId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for queue updates
    newSocket.on('queue.updated', (payload) => {
      const queueEntry = payload.entry || payload;
      setQueue(prev => {
        const exists = prev.find(q => q.id === queueEntry.id);
        if (exists) {
          return prev.map(q => q.id === queueEntry.id ? queueEntry : q);
        }
        return [...prev, queueEntry].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [doctorId]);

  return { queue, isConnected, socket };
}
