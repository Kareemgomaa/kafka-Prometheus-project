import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { traceMiddleware } from './middlewares/trace.middleware.js';
import { connectKafka, producer } from './config/kafka.config.js';
import { getMetrics, metricsContentType, kafkaProducedCounter } from '../services/metrics.service.js';
import axios from 'axios';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(traceMiddleware);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PROMETHEUS_URL = 'http://localhost:9090/api/v1/query_range';

app.get('/api/order', async (req, res) => {
    try {
        console.log(`\n------------------------------------------------------`);
        console.log(`🛒Trace ID: ${req.traceId}`);
        console.log(`⏱️ waiting for 3 seconds before sending event to Kafka...`);
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

        console.log(`📨 send event to Kafka with Trace ID: ${req.traceId}`);
        kafkaProducedCounter.inc({ topic: topicName });

        res.status(200).json({ 
            success: true, 
            message: "Order placed and sent to Kafka via slowed motion!",
            traceId: req.traceId 
        });

    } catch (error) {
        console.error('❌ Error inside controller:', error);
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
                query: 'http_requests_total',
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
                value: parseInt(pt[1])
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
                query: 'process_cpu_user_seconds_total',
                start,
                end,
                step: '15s'
            }
        });

        const chartData = response.data.data.result.map(series => ({
            label: 'CPU User Time (Seconds)',
            points: series.values.map(pt => ({
                time: new Date(pt[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: parseFloat(parseFloat(pt[1]).toFixed(4))
            }))
        }));

        res.json({ success: true, type: 'cpu', data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await connectKafka(); 
});