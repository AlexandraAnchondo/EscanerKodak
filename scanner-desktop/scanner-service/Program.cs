using TwainDotNet.WinFroms;
using TwainDotNet;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<ScanService>(); // Registrar servicio

var app = builder.Build();

app.MapGet("/health", () =>
{
    return Results.Ok(new { ok = true });
});

app.MapGet("/scanners", (ScanService service) =>
{
    List<string> scanners = null;

    var thread = new Thread(() =>
    {
        using var form = new Form();
        form.ShowInTaskbar = false;
        form.WindowState = FormWindowState.Minimized;

        var twain = new Twain(new WinFormsWindowMessageHook(form));
        scanners = twain.SourceNames.ToList(); // <- guardar en variable externa
    });

    thread.SetApartmentState(ApartmentState.STA);
    thread.Start();
    thread.Join();

    return scanners ?? new List<string>();
});

app.MapPost("/scan", (ScanRequest req, ScanService service) =>
{
    if (string.IsNullOrWhiteSpace(req.ScannerName))
        return Results.BadRequest("ScannerName requerido");

    var jobId = service.QueueScan(req.ScannerName, req.Settings);
    return Results.Ok(new { jobId });
});

app.MapGet("/scan/status/{id}", (string id, ScanService service) =>
{
    if (!Guid.TryParse(id, out var guid))
        return Results.BadRequest("ID inválido");

    var job = service.GetJob(guid);
    if (job == null)
        return Results.NotFound();

    if (!job.Completed)
        return Results.Ok(new { status = "pending" });

    if (job.Error != null)
        return Results.Ok(new { status = "error", error = job.Error.Message });

    return Results.Ok(new
    {
        status = "done",
        files = job.ImagePaths.Select(Path.GetFileName)
    });
});

app.Run();
