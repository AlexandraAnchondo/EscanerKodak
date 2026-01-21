using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using TwainDotNet;
using TwainDotNet.WinFroms;

public class ScanJob
{
    public string ScannerName { get; set; }
    public List<string> ImagePaths { get; set; } = new List<string>();
    public bool Completed { get; set; } = false;
    public Exception Error { get; set; } = null;
    public List<string> ImageBase64 { get; set; } = new List<string>();

}

public class ScanService
{
    private readonly ConcurrentDictionary<Guid, ScanJob> _jobs = new();
    
    public Guid QueueScan(string scannerName)
    {
        var jobId = Guid.NewGuid();
        var job = new ScanJob { ScannerName = scannerName };
        _jobs[jobId] = job;

        // Ejecutar escaneo en hilo STA
        Task.Run(() => RunScan(jobId, job));

        return jobId;
    }

    public ScanJob GetJob(Guid jobId)
    {
        if (_jobs.TryGetValue(jobId, out var job))
            return job;
        return null;
    }

    private void RunScan(Guid jobId, ScanJob job)
    {
        try
        {
            var thread = new Thread(() =>
            {
                using var form = new Form();
                form.ShowInTaskbar = false;
                form.StartPosition = FormStartPosition.CenterScreen;
                form.Size = new Size(200, 200);
                form.Location = new Point(0, 0);
                form.WindowState = FormWindowState.Normal;

                var twain = new Twain(new WinFormsWindowMessageHook(form));

                if (!twain.SourceNames.Contains(job.ScannerName))
                    throw new Exception("Scanner no encontrado");

                List<Image> scannedImages = new List<Image>();

                twain.TransferImage += (s, e) =>
                {
                    if (e.Image != null)
                        scannedImages.Add(e.Image);
                };

                twain.ScanningComplete += (s, e) =>
                {
                    // Cuando TWAIN termina, cerramos el formulario y liberamos el hilo
                    form.Invoke(new Action(() => form.Close()));
                };

                var settings = new TwainDotNet.ScanSettings()
                {
                    UseDocumentFeeder = true,
                    ShowTwainUI = false,
                    ShowProgressIndicatorUI = false,
                    UseDuplex = true,
                    Resolution = ResolutionSettings.ColourPhotocopier,
                    Area = null,
                    ShouldTransferAllPages = true
                };

                form.Shown += (s, e) =>
                {
                    twain.SelectSource(job.ScannerName);
                    twain.StartScanning(settings);
                };

                Application.Run(form); // Aquí TWAIN puede procesar mensajes

                // Guardar imágenes
                string folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "scans");
                Directory.CreateDirectory(folder);

                // Después de guardar cada imagen, añade Base64
                foreach (var img in scannedImages)
                {
                    string path = Path.Combine(folder, $"scan_{Guid.NewGuid()}.jpg");
                    img.Save(path, ImageFormat.Jpeg);
                    job.ImagePaths.Add(path);

                    using var ms = new MemoryStream();
                    img.Save(ms, ImageFormat.Jpeg);
                    string base64 = Convert.ToBase64String(ms.ToArray());
                    job.ImageBase64.Add(base64); // <-- nueva propiedad
                    img.Dispose();
                }


                job.Completed = true;
            });

            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join(); // Esperar a que el hilo STA termine
        }
        catch (Exception ex)
        {
            job.Error = ex;
            job.Completed = true;
        }
    }

}
