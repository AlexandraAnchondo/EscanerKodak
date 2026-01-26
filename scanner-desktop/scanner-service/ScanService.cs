using Dynarithmic;
using System.Collections.Concurrent;
using System.Text;

public class ScanService
{
    private readonly ConcurrentDictionary<Guid, ScanJob> _jobs = new();
    private readonly string _scanDir =
        Path.Combine(AppContext.BaseDirectory, "scans");

    public ScanService()
    {
        Directory.CreateDirectory(_scanDir);
    }

    // ---------- SCANNERS ----------
    public List<string> GetScanners()
    {
        var saved = ScannerStore.Load();
        return saved != null ? new() { saved } : new();
    }

    public string SelectScannerWithUI()
    {
        var h = TwainAPI.DTWAIN_SysInitialize();
        if (h == IntPtr.Zero)
            throw new Exception("DTWAIN no inicializó");

        var src = TwainAPI.DTWAIN_SelectSource();
        if (src == IntPtr.Zero)
            throw new Exception("No se seleccionó scanner");

        var sb = new StringBuilder(256);
        TwainAPI.DTWAIN_GetSourceProductName(src, sb, sb.Capacity);

        var name = sb.ToString();
        ScannerStore.Save(name);

        TwainAPI.DTWAIN_SysDestroy();
        return name;
    }

    // ---------- SCAN ----------
    public Guid StartScan(int dpi, string colorMode, bool duplex, bool feeder)
    {
        var scannerName = ScannerStore.Load();
        if (scannerName == null)
            throw new Exception("Scanner no configurado");

        var jobId = Guid.NewGuid();
        var job = new ScanJob { Status = "pending" };
        _jobs[jobId] = job;

        new Thread(() =>
        {
            try
            {
                var h = TwainAPI.DTWAIN_SysInitialize();
                if (h == IntPtr.Zero)
                    throw new Exception("DTWAIN no inicializó");

                var src = TwainAPI.DTWAIN_SelectSourceByName(scannerName);
                if (src == IntPtr.Zero)
                    throw new Exception("No se pudo abrir el scanner");

                var file = Path.Combine(_scanDir, $"{jobId}.bmp");

                TwainAPI.DTWAIN_SetResolution(src, dpi);
                TwainAPI.DTWAIN_EnableDuplex(src, duplex ? 1 : 0);

                int status = 0;
                TwainAPI.DTWAIN_AcquireFile(
                    src,
                    file,
                    TwainAPI.DTWAIN_BMP,
                    TwainAPI.DTWAIN_USENATIVE | TwainAPI.DTWAIN_USENAME,
                    TwainAPI.DTWAIN_PT_DEFAULT,
                    1,
                    1,
                    1,
                    ref status
                );

                job.Files.Add(Path.GetFileName(file));
                job.Status = "completed";

                TwainAPI.DTWAIN_SysDestroy();
            }
            catch (Exception ex)
            {
                job.Status = "error";
                job.Error = ex.Message;
            }
        })
        { IsBackground = true }.Start();

        return jobId;
    }

    public ScanJob? GetJob(Guid id)
        => _jobs.TryGetValue(id, out var j) ? j : null;
}
