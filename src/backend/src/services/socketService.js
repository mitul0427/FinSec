let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log(`[SOC Gateway] Client connected to real-time threat feed: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[SOC Gateway] Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  return ioInstance;
};

export const broadcastSecurityAlert = (alert) => {
  if (ioInstance) {
    ioInstance.emit('security_alert', alert);
  }
};
