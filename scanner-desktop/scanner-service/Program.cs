var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ScanService>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok());

app.MapGet("/scanners", (ScanService s) =>
    Results.Ok(s.GetScanners()));

app.MapPost("/select-scanner", (ScanService s) =>
{
    var name = s.SelectScannerWithUI();
    return Results.Ok(new[] { name });
});

app.MapPost("/scan", (ScanService s, ScanRequest req) =>
{
    var id = s.StartScan(
        req.Settings.Dpi,
        req.Settings.ColorMode,
        req.Settings.Duplex,
        req.Settings.UseFeeder
    );
    return Results.Ok(new { jobId = id });
});

app.MapGet("/scan/status/{id:guid}", (ScanService s, Guid id) =>
{
    var job = s.GetJob(id);
    return job == null ? Results.NotFound() : Results.Ok(job);
});

app.Run("http://localhost:5000");
