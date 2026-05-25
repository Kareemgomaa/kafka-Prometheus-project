import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GetMetricsUseCase } from '../../application/use-cases/get-metrics.usecase.js';

export function initWebSocketServer(httpServer: HttpServer, getMetricsUseCase: GetMetricsUseCase): Server {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on('connection', (socket: Socket) => {
    console.log(` Client connected to WebSocket: ${socket.id}`);

    const sendLiveMetrics = async () => {
      try {
        const liveMetrics = await getMetricsUseCase.executeLiveMetrics();
        socket.emit('server-status', {
          success: true,
          timestamp: new Date().toLocaleTimeString(),
          metrics: liveMetrics
        });
      } catch (error: any) {
        console.error("Error broadcasting over socket:", error.message);
      }
    };

    sendLiveMetrics();
    const metricsInterval = setInterval(sendLiveMetrics, 5000);

    socket.on('disconnect', () => {
      clearInterval(metricsInterval);
      console.log(`Client disconnected from WebSocket: ${socket.id}`);
    });
  });

  return io;
}