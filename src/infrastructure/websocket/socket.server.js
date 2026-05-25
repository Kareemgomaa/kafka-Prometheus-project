import { Server } from 'socket.io';

export function initWebSocketServer(httpServer, getMetricsUseCase) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on('connection', (socket) => {
    console.log(` Client connected to WebSocket: ${socket.id}`);

    const sendLiveMetrics = async () => {
      try {
        const liveMetrics = await getMetricsUseCase.executeLiveMetrics();
        socket.emit('server-status', {
          success: true,
          timestamp: new Date().toLocaleTimeString(),
          metrics: liveMetrics
        });
      } catch (error) {
        console.error("Error broadcasting over socket:", error.message);
      }
    };

    sendLiveMetrics();
    const metricsInterval = setInterval(sendLiveMetrics, 5000);

    socket.on('disconnect', () => {
      clearInterval(metricsInterval);
      console.log(` Client disconnected from WebSocket: ${socket.id}`);
    });
  });

  return io;
}