import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL === '/api' 
  ? window.location.origin 
  : import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = (userId?: string, token?: string) => {
  if (!socket && userId && token) {
    socket = io(SOCKET_URL, {
      query: { userId },
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
