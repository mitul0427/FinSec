let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log(`[SOC Gateway] Client connected to real-time threat feed: ${socket.id}`);

    // Allow user to join their private channel
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] Client ${socket.id} joined room user:${userId}`);
      }
    });

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

export const broadcastSuspiciousTransaction = (transaction, reason) => {
  if (ioInstance) {
    const payload = {
      message: 'Suspicious transaction detected. Please confirm.',
      reason,
      transaction
    };
    // Emit to specific user room and also broadcast globally for demonstration
    if (transaction.userId) {
      ioInstance.to(`user:${transaction.userId}`).emit('suspicious_transaction', payload);
    }
    ioInstance.emit('suspicious_transaction', payload);
  }
};
