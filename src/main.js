import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io'; 
import { traceMiddleware } from './middlewares/trace.middleware.js';
import { connectKafka, producer } from './config/kafka.config.js';
import { getMetrics, metricsContentType, kafkaProducedCounter } from '../services/metrics.service.js';
import axios from 'axios';
import os from 'os';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(traceMiddleware);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PROMETHEUS_URL = 'http://localhost:9090/api/v1/query_range';



async function getMetricForSocket(query) {
    try {
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 
        const response = await axios.get(PROMETHEUS_URL, { params: { query, start, end, step: '15s' } });
        return response.data.data.result;
    } catch (error) {
        return [];
    }
}

io.on('connection', (socket) => {
    console.log(` Client connected to WebSocket: ${socket.id}`);
    const sendLiveMetrics = async () => {
        const resRequests = await getMetricForSocket('sum by (route, status_code) (rate(http_requests_total[1m]))');
        const requestsData = resRequests.map(series => ({
            route: series.metric.route || 'unknown',
            status: series.metric.status_code || '200',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        const resRam = await getMetricForSocket('(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100');
        const ramData = resRam.map(series => ({
            label: 'RAM Usage (%)',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        const resCpu = await getMetricForSocket('rate(process_cpu_user_seconds_total[1m]) * 100'); 
        const cpuData = resCpu.map(series => ({
            label: 'CPU Usage (%)',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        let resDisk = await getMetricForSocket('((node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes) * 100');
        let diskData = [];
        
        if (resDisk && resDisk.length > 0) {
            diskData = resDisk.map(series => ({
                device: series.metric.device || 'Primary Storage',
                mountpoint: series.metric.mountpoint || '/',
                points: series.values.map(pt => ({
                    time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    value: parseFloat(parseFloat(pt[1]).toFixed(2))
                }))
            }));
        } else {
            diskData = [{
                device: 'System Root',
                mountpoint: '/',
                points: [{
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    value: 45.5 
                }]
            }];
        }

        socket.emit('server-status', {
            success: true,
            timestamp: new Date().toLocaleTimeString(),
            metrics: { requests: requestsData, ram: ramData, cpu: cpuData, disk: diskData }
        });
    };

    sendLiveMetrics();
    const metricsInterval = setInterval(sendLiveMetrics, 5000);

    socket.on('disconnect', () => {
        clearInterval(metricsInterval);
        console.log(` Client disconnected: ${socket.id}`);
    });
});



app.get('/api/order', async (req, res) => {
    try {
        console.log(`\n------------------------------------------------------`);
        console.log(`Trace ID: ${req.traceId}`);
        console.log(` waiting for 3 seconds before sending event to Kafka...`);
        console.log(`------------------------------------------------------`);

        await delay(3000);

        const orderData = {
            orderId: Math.floor(Math.random() * 10000),
            product: 'Kafka Course',
            price: 150
        };

        const topicName = 'order-events';
        await producer.send({
            topic: topicName,
            messages: [
                {
                    value: JSON.stringify(orderData),
                    headers: {
                        'x-trace-id': req.traceId 
                    }
                }
            ]
        });

        console.log(`send event to Kafka with Trace ID: ${req.traceId}`);
        kafkaProducedCounter.inc({ topic: topicName });

        res.status(200).json({ 
            success: true, 
            message: "Order placed and sent to Kafka via slowed motion!",
            traceId: req.traceId 
        });

    } catch (error) {
        console.error('Error inside controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', metricsContentType);
    res.send(await getMetrics());
});


app.get('/api/admin/metrics/requests', async (req, res) => {
    try {
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 

        const response = await axios.get(PROMETHEUS_URL, {
            params: {
                query: 'sum by (route, status_code) (rate(http_requests_total[1m]))', // تعديل للـ rate
                start,
                end,
                step: '15s' 
            }
        });

        const chartData = response.data.data.result.map(series => ({
            route: series.metric.route || 'unknown',
            status: series.metric.status_code || '200',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        res.json({ success: true, type: 'requests', data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/metrics/ram', async (req, res) => {
    try {
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 

        const response = await axios.get(PROMETHEUS_URL, {
            params: {
                query: '(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100',
                start,
                end,
                step: '15s'
            }
        });

        const chartData = response.data.data.result.map(series => ({
            label: 'RAM Usage (%)',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        res.json({ success: true, type: 'ram', data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/metrics/cpu', async (req, res) => {
    try {
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 

        const response = await axios.get(PROMETHEUS_URL, {
            params: {
                query: 'rate(process_cpu_user_seconds_total[1m]) * 100', 
                start,
                end,
                step: '15s'
            }
        });

        const chartData = response.data.data.result.map(series => ({
            label: 'CPU Usage (%)',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2))
            }))
        }));

        res.json({ success: true, type: 'cpu', data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/metrics/disk', async (req, res) => {
    try {
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 

        const response = await axios.get(PROMETHEUS_URL, {
            params: {
                query: '((node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes) * 100',
                start,
                end,
                step: '15s'
            }
        });

        const chartData = response.data.data.result.map(series => ({
            device: series.metric.device || 'Primary Storage',
            mountpoint: series.metric.mountpoint || '/',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(2)) 
            }))
        }));

        res.json({ success: true, type: 'disk', data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
    console.log(` Server running on port ${PORT} (HTTP & WebSockets Enabled)`);
    await connectKafka(); 
});