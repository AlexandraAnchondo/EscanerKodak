using Microsoft.Extensions.FileProviders;


var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// 🔹 Controllers
builder.Services.AddControllers();

// 🔹 CORS (para React)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// 🔹 Swagger (opcional pero útil)
builder.Services.AddEndpointsApiExplorer();
var app = builder.Build();


// 🔹 HTTPS (opcional)
// app.UseHttpsRedirection();

// 🔹 CORS
app.UseCors();

// 🔹 Static files (wwwroot)
app.UseStaticFiles();

// 🔹 Static files para PDFs escaneados
var filesPath = Path.Combine(Directory.GetCurrentDirectory(), "Files");

Directory.CreateDirectory(filesPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(filesPath),
    RequestPath = "/files"
});

// 🔹 Routing
app.MapControllers();

// 🔹 Run
app.Run();
