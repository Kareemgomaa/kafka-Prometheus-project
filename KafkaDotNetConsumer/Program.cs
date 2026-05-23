using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Confluent.Kafka;

// 1. Kafka Connection Configuration
var config = new ConsumerConfig
{
    BootstrapServers = "localhost:9092",
    GroupId = "dotnet-order-consumer-group",
    AutoOffsetReset = AutoOffsetReset.Earliest
};

using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
consumer.Subscribe("order-events");

Console.WriteLine("======================================================");
Console.WriteLine("🚀 .NET Consumer is up and listening to Kafka...");
Console.WriteLine("======================================================");

CancellationTokenSource cts = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

try
{
    while (true)
    {
        // 2. Consume Message from Kafka
        var consumeResult = consumer.Consume(cts.Token);

        // 3. Extract the Trace ID from Headers
        string traceId = "❌ NOT FOUND";
        if (consumeResult.Message.Headers != null)
        {
            if (consumeResult.Message.Headers.TryGetLastBytes("x-trace-id", out var headerBytes))
            {
                traceId = Encoding.UTF8.GetString(headerBytes);
            }
        }

        Console.WriteLine($"\n📥 [STAGE 4] .NET Consumer received message from Kafka!");
        Console.WriteLine($"🆔 [Trace ID Handed Over]: {traceId}");
        Console.WriteLine("------------------------------------------------------");

        // 🔥 Trigger internal tracking workflow inside .NET (Slow Motion)
        await ProcessOrderWorkflowAsync(traceId, consumeResult.Message.Value);
    }
}
catch (OperationCanceledException)
{
    consumer.Close();
}

#region Internal Distributed Tracing Workflow

// Main workflow orchestrator
async Task ProcessOrderWorkflowAsync(string traceId, string orderData)
{
    // Step A: Save to Database
    await SaveToDatabaseAsync(traceId, orderData);

    // Step B: Notify Shipping Service
    await NotifyShippingServiceAsync(traceId);
}

async Task SaveToDatabaseAsync(string traceId, string orderData)
{
    Console.WriteLine($"⚙️  [STAGE 5] Entering (OrderDatabaseService)...");
    Console.WriteLine($"🆔 [Using Trace ID]: {traceId}");
    Console.WriteLine($"💾 Saving order details to database... (Waiting 3s)");
    
    await Task.Delay(3000); // 3 seconds delay
    Console.WriteLine($"✅ Order saved to database successfully.");
    Console.WriteLine("------------------------------------------------------");
}

async Task NotifyShippingServiceAsync(string traceId)
{
    Console.WriteLine($"🚚 [STAGE 6] Entering (ShippingService)...");
    Console.WriteLine($"🆔 [Using Trace ID]: {traceId}");
    Console.WriteLine($"📦 Preparing package and generating shipping label... (Waiting 3s)");
    
    await Task.Delay(3000); // 3 seconds delay
    Console.WriteLine($"🎉 [END OF JOURNEY] Order dispatched to shipping successfully with the same Trace ID!");
    Console.WriteLine("======================================================");
}

#endregion